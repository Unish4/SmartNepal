import { validationResult } from "express-validator";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { sendStatusChangeEmail } from "../utils/emailService.js";
import { cleanupUploadedFiles } from "../middleware/upload.js";
import { notifyStatusChange } from "../services/notificationService.js";
import { awardBadgesIfEarned } from "../services/badgeService.js"; 
import User from "../models/User.js"; 
import Boundary from "../models/Boundary.js"; 
import { computeBoundingBox } from "../utils/geoUtils.js"; 


const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

// ─── GET /api/field/assignments
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

    if (
      !issue.assignedTo ||
      issue.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This issue is not assigned to you",
      });
    }

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
          return uploadToCloudinary(buffer, "NepalSewa/resolutions");
        }),
      );
      issue.resolutionProof.push(...results.map((r) => r.secure_url));
      issue.resolvedAt = new Date();
      if (req.body.cost !== undefined && req.body.cost !== "") {
        issue.resolutionCost = parseFloat(req.body.cost); // ← Phase 41
      }
    }

    if (rejectionReason) {
      issue.rejectionReason = rejectionReason.trim();
    }

    const previousStatus = issue.status;

    issue.status = status;
    await issue.save();
    await issue.populate("author", "name email");

    if (status === "resolved") {
      const updatedIssue = await Issue.findOneAndUpdate(
        { _id: issue._id, resolutionCounted: { $ne: true } },
        { $set: { resolutionCounted: true } },
        { new: true }
      );
      if (updatedIssue) {
        User.findByIdAndUpdate(issue.author._id, { $inc: { "stats.reportsResolved": 1 } })
          .then(() => awardBadgesIfEarned(issue.author._id))
          .catch((err) => console.error(`Failed to update resolver stats for issue ${issue._id}: ${err.message}`));
      }
    }

    sendStatusChangeEmail(issue._id, status, rejectionReason || null).catch(
      (err) =>
        console.error(
          `Email notification failed for issue ${issue._id} (${status}): ${err.message}`,
        ),
    );

    notifyStatusChange(issue.author._id, issue, status) // ← Phase 31
      .catch((err) =>
        console.error(
          `In-app notification failed for issue ${issue._id} (${status}): ${err.message}`,
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

// ─── GET /api/field/offline-map-bounds 
export const getOfflineMapBounds = async (req, res, next) => {
  try {
    const province = req.user.jurisdiction?.province || req.user.province;
    const district = req.user.jurisdiction?.district || req.user.district;

    if (!province) {
      return res.status(400).json({
        success: false,
        message: "No jurisdiction assigned — contact your admin to set one.",
      });
    }

    const boundary = district
      ? await Boundary.findOne({ type: "district", name: district })
      : await Boundary.findOne({ type: "province", name: province });

    if (!boundary) {
      return res.status(404).json({
        success: false,
        message: "No boundary data found for your jurisdiction. Run the Phase 17 boundary seed script or contact an administrator.",
      });
    }

    const bbox = computeBoundingBox(boundary.geometry);

    res.status(200).json({ success: true, label: district || province, bbox });
  } catch (error) { next(error); }
};