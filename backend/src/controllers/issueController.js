import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Issue from "../models/Issue.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

const assertOwnership = (issue, user, res) => {
  const isOwner = issue.author.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to modify this issue");
  }
};

// ─── POST /api/issues ─────────────────────────────────────────────────────────
export const createIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { title, description, category, priority, address, lat, lng } =
      req.body;
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;

    let imageUrls = [];
    if (req.files?.length > 0) {
      const results = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, "smartnepal/issues")),
      );
      imageUrls = results.map((r) => r.secure_url);
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || "low",
      location: { address: address || "", lat: parsedLat, lng: parsedLng },
      images: imageUrls,
      author: req.user._id,
    });

    await issue.populate("author", "name email");
    res.status(201).json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/issues ──────────────────────────────────────────────────────────
export const getIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      Issue.find()
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/issues/me ───────────────────────────────────────────────────────
export const getMyIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      Issue.find({ author: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments({ author: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/issues/:id ──────────────────────────────────────────────────────
export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("author", "name email province")
      .lean();

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }
    res.status(200).json({ success: true, issue });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── PUT /api/issues/:id ──────────────────────────────────────────────────────
export const updateIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    assertOwnership(issue, req.user, res);

    const { title, description, category, priority, address, lat, lng } =
      req.body;

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (category !== undefined) issue.category = category;
    if (priority !== undefined) issue.priority = priority;
    if (address !== undefined) issue.location.address = address;
    if (lat !== undefined) issue.location.lat = parseFloat(lat);
    if (lng !== undefined) issue.location.lng = parseFloat(lng);

    await issue.save();
    await issue.populate("author", "name email");
    res.status(200).json({ success: true, issue });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── DELETE /api/issues/:id ───────────────────────────────────────────────────
export const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }
    assertOwnership(issue, req.user, res);
    await issue.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Issue deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── POST /api/issues/:id/upvote ─────────────────────────────────────────────
// Toggle: calling this endpoint adds the vote if absent, removes it if present.
// We use MongoDB's $addToSet (atomic add-if-not-exists) and $pull (atomic remove)
// so concurrent requests from the same user can never create duplicate entries
// in the upvoterIds array even under race conditions.
export const upvoteIssue = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Atomic findByIdAndUpdate using aggregation pipeline to conditional toggle.
    // This resolves the TOCTOU race condition and ensures atomic operations.
    const updated = await Issue.findByIdAndUpdate(
      req.params.id,
      [
        {
          $set: {
            upvoterIds: {
              $cond: {
                if: { $in: [userObjectId, { $ifNull: ["$upvoterIds", []] }] },
                then: {
                  $filter: {
                    input: { $ifNull: ["$upvoterIds", []] },
                    as: "id",
                    cond: { $ne: ["$$id", userObjectId] }
                  }
                },
                else: { $concatArrays: [{ $ifNull: ["$upvoterIds", []] }, [userObjectId]] }
              }
            }
          }
        }
      ],
      { returnDocument: "after", updatePipeline: true }
    ).select("upvoterIds");

    // Add a null check for updated after the write so a deleted issue
    // returns the proper 404 response instead of throwing on updated.upvoterIds.
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // Derive isUpvoted from the returned updated document rather than alreadyUpvoted.
    const isUpvoted = (updated.upvoterIds ?? []).some(
      (id) => id.toString() === userId.toString(),
    );

    res.status(200).json({
      success: true,
      // Return the full array so the frontend can sync exactly, not just a count.
      // The frontend derives the count from array.length and checks isUpvoted
      // by seeing if the current user's _id is in the array.
      upvoterIds: updated.upvoterIds,
      upvoteCount: updated.upvoterIds.length,
      isUpvoted,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};
