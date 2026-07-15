import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import {
  sendAssignmentEmail,
  sendStatusChangeEmail,
} from "../utils/emailService.js";
import { runEscalationCheck } from "../services/escalationService.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

// Checks if the issue is within the admin's jurisdiction. Throws a 403 error if not.
const assertWithinJurisdiction = (issue, user, res) => {
  if (user.role === "super_admin") return;

  const { province, district } = user.jurisdiction || {};
  const matchesProvince = province && issue.location?.province === province;
  const matchesDistrict = !district || issue.location?.district === district;

  if (!matchesProvince || !matchesDistrict) {
    res.status(403);
    throw new Error("This issue is outside your assigned jurisdiction");
  }
};

//  GET /api/admin/stats
// Runs five queries in parallel — dashboard loads in one round-trip.
export const getDashboardStats = async (req, res, next) => {
  try {
    const filter = req.jurisdictionFilter || {};
    const now = new Date();

    const userFilter = { role: "citizen" };
    if (req.user.role !== "super_admin" && req.user.jurisdiction) {
      const { province, district } = req.user.jurisdiction;
      if (province) userFilter.province = province;
      if (district) userFilter.district = district;
    }

    const [
      totalIssues,
      totalUsers,
      issuesByStatus,
      issuesByCategory,
      recentIssues,
      overdueCount,
    ] = await Promise.all([
      Issue.countDocuments(filter),
      User.countDocuments(userFilter),

      // Group issues by status — gives { open: 12, resolved: 4, … }
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      // Group issues by category — gives { "Road Damage": 8, "Garbage": 3, … }
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),

      Issue.find(filter)
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Issue.countDocuments({
        ...filter,
        slaDeadline: { $lt: now },
        status: { $nin: ["resolved", "rejected"] },
      }),
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
        overdueCount,
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

    const {
      search,
      category,
      status,
      priority,
      sort,
      province,
      district,
      overdue,
    } = req.query;

    const match = { ...req.jurisdictionFilter }; // Start with jurisdiction filter from middleware

    if (overdue === "true") {
      match.slaDeadline = { $lt: new Date() };
      match.status = { $nin: ["resolved", "rejected"] };
    }
    if (search?.trim()) {
      match.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (category) match.category = String(category);
    if (status) match.status = String(status);
    if (priority) match.priority = String(priority);

    if (req.user.role === "super_admin") {
      if (province) match["location.province"] = province;
      if (district) match["location.district"] = district;
    }

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

    assertWithinJurisdiction(issue, req.user, res);

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
    const { role } = req.query;

    const query = {};
    const VALID_ROLES = ["citizen", "admin", "field_worker"];
    if (role && VALID_ROLES.includes(role)) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
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

// POST /api/admin/field-workers
export const createFieldWorker = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { name, email, password, department, phone, province, district } =
      req.body;

    if (req.user.role !== "super_admin") {
      const { province: adminProvince, district: adminDistrict } =
        req.user.jurisdiction || {};
      if (
        province !== adminProvince ||
        (adminDistrict && district !== adminDistrict)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only create field workers within your own jurisdiction",
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let fieldWorker;
    try {
      fieldWorker = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "field_worker",
        department,
        phone,
        jurisdiction: { province, district },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      fieldWorker: {
        _id: fieldWorker._id,
        name: fieldWorker.name,
        email: fieldWorker.email,
        role: fieldWorker.role,
        department: fieldWorker.department,
        phone: fieldWorker.phone,
        createdAt: fieldWorker.createdAt,
        jurisdiction: fieldWorker.jurisdiction,
      },
    });
  } catch (error) {
    next(error);
  }
};
// GET /api/admin/field-workers
export const getFieldWorkers = async (req, res, next) => {
  try {
    const { department } = req.query;

    const query = { role: "field_worker" };
    if (department) query.department = department;

    if (req.user.role !== "super_admin") {
      const { province, district } = req.user.jurisdiction || {};
      query["jurisdiction.province"] = province || "NO_JURISDICTION_ASSIGNED";
      if (district) query["jurisdiction.district"] = district;
    } else {
      if (req.query.province)
        query["jurisdiction.province"] = req.query.province;
      if (req.query.district)
        query["jurisdiction.district"] = req.query.district;
    }

    const fieldWorkers = await User.find(query)
      .select("-password")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ success: true, fieldWorkers });
  } catch (error) {
    next(error);
  }
};

//  PATCH /api/admin/issues/:id/assign
// Assigns an issue to a field worker. This is the dispatch action.
export const assignIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { fieldWorkerId } = req.body;

    const [issue, fieldWorker] = await Promise.all([
      Issue.findById(req.params.id),
      User.findOne({ _id: fieldWorkerId, role: "field_worker" }),
    ]);

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }
    if (!fieldWorker) {
      return res
        .status(404)
        .json({ success: false, message: "Field worker not found" });
    }

    assertWithinJurisdiction(issue, req.user, res);
    if (req.user.role !== "super_admin") {
      const { province, district } = req.user.jurisdiction || {};
      const fw = fieldWorker.jurisdiction || {};
      if (fw.province !== province || (district && fw.district !== district)) {
        return res.status(403).json({
          success: false,
          message:
            "You can only assign field workers from your own jurisdiction",
        });
      }
    }

    if (["resolved", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot reassign an issue that has already been resolved or rejected",
      });
    }

    const previousStatus = issue.status;

    issue.assignedTo = fieldWorker._id;
    issue.assignedBy = req.user._id;
    issue.assignedAt = new Date();

    if (issue.status === "open") {
      issue.status = "verified";
    }

    await issue.save();
    await issue.populate("author", "name email");
    await issue.populate("assignedTo", "name department");

    sendAssignmentEmail(issue._id, fieldWorker._id).catch((err) =>
      console.error(`Assignment email failed: ${err.message}`),
    );

    if (issue.status !== previousStatus) {
      sendStatusChangeEmail(issue._id, issue.status, null).catch((err) =>
        console.error(`Status email failed: ${err.message}`),
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

export const triggerEscalationSweep = async (req, res, next) => {
  try {
    const result = await runEscalationCheck();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
