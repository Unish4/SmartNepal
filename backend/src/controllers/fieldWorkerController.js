import { validationResult } from "express-validator";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { sendStatusChangeEmail } from "../utils/emailService.js";
import { cleanupUploadedFiles } from "../middleware/upload.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

// ─── GET /api/field/assignments 
// Returns issues assigned to the currently logged-in field worker.
// Sorted by priority first (critical → low), then newest first within
// each priority tier — a field worker should see their most urgent job
// at the top of the list, not just their most recent one.
export const getMyAssignments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const match = { assignedTo: new mongoose.Types.ObjectId(req.user._id) };
    if (status) {
      match.status = status;
    }

    const [assignments, countResult] = await Promise.all([
      Issue.aggregate([
        { $match: match },
        {
          $addFields: {
            priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "critical"] }, then: 0 },
                  { case: { $eq: ["$priority", "high"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { priorityRank: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      ]),
      Issue.countDocuments(match),
    ]);

    res.status(200).json({
      success: true,
      assignments,
      pagination: {
        page,
        limit,
        total: countResult,
        pages: Math.ceil(countResult / limit) || 1,
        hasNext: page < Math.ceil(countResult / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/field/stats 
// Quick counts for the dashboard header strip — total assigned, pending
// start, in progress, resolved. One aggregation call instead of four
// separate countDocuments queries.
export const getFieldStats = async (req, res, next) => {
  try {
    const counts = await Issue.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusCounts = counts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending: statusCounts.verified ?? 0, // assigned, not started
        inProgress: statusCounts["in-progress"] ?? 0,
        resolved: statusCounts.resolved ?? 0,
        rejected: statusCounts.rejected ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/field/assignments/:id/status 
// The core dispatch action. A field worker moves their assigned issue
// through in-progress → resolved (with photo proof) or → rejected
// (with a reason, e.g. duplicate, inaccessible, false report).
export const updateAssignmentStatus = async (req, res, next) => {
  try {
    checkValidation(req, res);

    const { status, rejectionReason } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // Ownership check — a field worker can ONLY act on issues assigned to
    // them specifically. This is enforced here, not just hidden in the UI,
    // because the endpoint is reachable by any authenticated field worker.
    if (
      !issue.assignedTo ||
      issue.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This issue is not assigned to you",
      });
    }

    // Resolving REQUIRES at least one proof photo. This is the entire
    // point of a dispatch verification loop — a status change to
    // "resolved" without evidence defeats the purpose of tracking field work.
    if (status === "resolved") {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please attach at least one photo as proof of resolution",
        });
      }

      const results = await Promise.all(
        req.files.map(async (file) => {
          const buffer = await readFile(file.path);
          return uploadToCloudinary(buffer, "smartnepal/resolutions");
        }),
      );
      issue.resolutionProof.push(...results.map((r) => r.secure_url));
      issue.resolvedAt = new Date();
    }

    if (rejectionReason) {
      issue.rejectionReason = rejectionReason.trim();
    }

    issue.status = status;
    await issue.save();
    await issue.populate("author", "name email");

    sendStatusChangeEmail(issue._id, status, rejectionReason || null).catch(
      (err) =>
        console.error(
          `Email notification failed for issue ${issue._id} (${status}): ${err.message}`,
        ),
    );

    res.status(200).json({ success: true, issue });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  } finally {
    await cleanupUploadedFiles(req.files);
    req.files = [];
  }
};
