import { validationResult } from "express-validator";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import { sendStatusChangeEmail } from "../utils/emailService.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

//  GET /api/admin/stats
// Runs five queries in parallel — dashboard loads in one round-trip.
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalIssues,
      totalUsers,
      issuesByStatus,
      issuesByCategory,
      recentIssues,
    ] = await Promise.all([
      Issue.countDocuments(),
      User.countDocuments(),

      // Group issues by status — gives { open: 12, resolved: 4, … }
      Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Group issues by category — gives { "Road Damage": 8, "Garbage": 3, … }
      Issue.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),

      Issue.find()
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Convert [{_id: "open", count: 4}] → { open: 4 } for cleaner frontend access.
    const statusCounts = issuesByStatus.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    const categoryCounts = issuesByCategory.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        totalUsers,
        statusCounts,
        categoryCounts,
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

//  GET /api/admin/issues
export const getAllIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    // Admins get up to 50 rows — more data-dense than the citizen 12-card grid.
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;

    const { search, category, status, priority, sort } = req.query;

    const match = {};
    if (search?.trim()) {
      match.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (category) match.category = String(category);
    if (status) match.status = String(status);
    if (priority) match.priority = String(priority);
    const sortStage = {
      oldest: { createdAt: 1 },
      "most-upvoted": { upvoteCount: -1 },
    }[sort] ?? { createdAt: -1 };

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
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
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

//  PATCH /api/admin/issues/:id/status.
export const updateIssueStatus = async (req, res, next) => {
  try {
    checkValidation(req, res);

    const { status, rejectionReason } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const previousStatus = issue.status;

    // Record the exact time the issue was resolved so Phase 11 analytics
    // can compute average resolution time per category.
    if (status === "resolved") {
      issue.resolvedAt = new Date();
    }

    issue.status = status;
    if (status === "rejected") {
      issue.rejectionReason = rejectionReason
        ? rejectionReason.trim()
        : undefined;
    } else {
      issue.rejectionReason = undefined;
    }
    await issue.save();
    await issue.populate("author", "name email");

    if (status !== previousStatus) {
      sendStatusChangeEmail(issue._id, status, rejectionReason || null).catch(
        (err) =>
          console.error(
            `Email notification failed for issue ${issue._id} (${status}): ${err.message}`,
          ),
      );
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

//  GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      users,
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
