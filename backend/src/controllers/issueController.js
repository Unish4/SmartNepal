import { validationResult } from "express-validator";
import Issue from "../models/Issue.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { categorizeIssue } from "../services/aiService.js";
import { detectBoundary } from "../services/gisService.js";

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

//  POST /api/issues
export const createIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { title, description, category, priority, address, lat, lng } =
      req.body;
    const idempotencyKey = req.body.idempotencyKey?.trim();

    if (idempotencyKey) {
      const existingIssue = await Issue.findOne({ idempotencyKey }).populate(
        "author",
        "name email",
      );

      if (existingIssue) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          issue: existingIssue,
        });
      }
    }

    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;

    let imageUrls = [];
    if (req.files?.length > 0) {
      const results = await Promise.all(
        req.files.map((f, idx) => {
          const publicId = idempotencyKey ? `${idempotencyKey}_img_${idx}` : null;
          return uploadToCloudinary(f.buffer, "NepalSewa/issues", undefined, publicId);
        }),
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
      idempotencyKey: idempotencyKey || undefined,
      author: req.user._id,
    });

    if (parsedLat && parsedLng) {
      detectBoundary(parsedLat, parsedLng)
        .then(async (boundary) => {
          if (boundary) {
            await Issue.findByIdAndUpdate(issue._id, {
              "location.province": boundary.province || "",
              "location.district": boundary.district || "",
              "location.municipality": boundary.municipality || "",
            });
          }
        })
        .catch((err) =>
          console.error(
            `GIS update failed for issue ${issue._id}: ${err.message}`,
          ),
        );
    }

    categorizeIssue(title, description)
      .then(async (aiResult) => {
        if (aiResult) {
          await Issue.findByIdAndUpdate(issue._id, {
            aiCategory: aiResult.category,
            aiPriority: aiResult.priority,
            aiConfidence: aiResult.confidence,
          });
        }
      })
      .catch((err) =>
        console.error(
          `Post-creation AI update failed for ${issue._id}: ${err.message}`,
        ),
      );

    await issue.populate("author", "name email");
    res.status(201).json({ success: true, issue });
  } catch (error) {
    if (error.code === 11000 && req.body.idempotencyKey) {
      const duplicateIssue = await Issue.findOne({
        idempotencyKey: req.body.idempotencyKey,
      }).populate("author", "name email");

      if (duplicateIssue) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          issue: duplicateIssue,
        });
      }
    }
    next(error);
  }
};

//  GET /api/issues
export const getIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const { search, category, status, priority, sort, province, district } =
      req.query;

    const match = {};

    if (search?.trim()) {
      match.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category) match.category = category;
    if (status) match.status = status;
    if (priority) match.priority = priority;
    if (province) match["location.province"] = province;
    if (district) match["location.district"] = district;
    const sortStage = {
      oldest: { createdAt: 1 },
      "most-upvoted": { upvoteCount: -1 },
    }[sort] ?? { createdAt: -1 }; // default: newest

    const [issues, countResult] = await Promise.all([
      Issue.aggregate([
        { $match: match },

        { $addFields: { upvoteCount: { $size: "$upvoterIds" } } },

        { $sort: sortStage },
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

        {
          $unwind: {
            path: "$author",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]),

      Issue.aggregate([{ $match: match }, { $count: "total" }]),
    ]);

    const total = countResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

//  GET /api/issues/me
export const getMyIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
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
        pages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

//  GET /api/issues/:id
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

//  PUT /api/issues/:id
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
    const latChanged =
      lat !== undefined && parseFloat(lat) !== issue.location.lat;
    const lngChanged =
      lng !== undefined && parseFloat(lng) !== issue.location.lng;
    if (lat !== undefined) issue.location.lat = parseFloat(lat);
    if (lng !== undefined) issue.location.lng = parseFloat(lng);

    await issue.save();
    if (
      (latChanged || lngChanged) &&
      issue.location.lat &&
      issue.location.lng
    ) {
      detectBoundary(issue.location.lat, issue.location.lng)
        .then(async (boundary) => {
          const boundaryUpdate = boundary
            ? {
                "location.province": boundary.province || "",
                "location.district": boundary.district || "",
                "location.municipality": boundary.municipality || "",
              }
            : {
                "location.province": "",
                "location.district": "",
                "location.municipality": "",
              };

          await Issue.findByIdAndUpdate(issue._id, boundaryUpdate);
        })
        .catch((err) =>
          console.error(
            `GIS re-detect failed for issue ${issue._id}: ${err.message}`,
          ),
        );
    }
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

//  DELETE /api/issues/:id
export const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }
    assertOwnership(issue, req.user, res);

    const imageUrls = issue.images || [];

    await issue.deleteOne();

    if (imageUrls.length > 0) {
      Promise.all(imageUrls.map((url) => deleteFromCloudinary(url))).catch((err) =>
        console.error("Failed to delete issue images from Cloudinary on delete", err)
      );
    }

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

//  POST /api/issues/:id/upvote
export const upvoteIssue = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const existing = await Issue.findById(req.params.id).select("upvoterIds");
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const alreadyUpvoted = existing.upvoterIds.some(
      (id) => id && id.toString() === userId.toString(),
    );

    const update = alreadyUpvoted
      ? { $pull: { upvoterIds: userId } }
      : { $addToSet: { upvoterIds: userId } };

    const updated = await Issue.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("upvoterIds");

    res.status(200).json({
      success: true,
      upvoterIds: updated.upvoterIds,
      upvoteCount: updated.upvoterIds.length,
      isUpvoted: !alreadyUpvoted,
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

export const getBoundaryOptions = async (req, res, next) => {
  try {
    const [provinces, districts] = await Promise.all([
      Issue.distinct("location.province", { "location.province": { $ne: "" } }),
      Issue.distinct("location.district", { "location.district": { $ne: "" } }),
    ]);

    res.status(200).json({
      success: true,
      provinces: provinces.filter(Boolean).sort(),
      districts: districts.filter(Boolean).sort(),
    });
  } catch (error) {
    next(error);
  }
};
