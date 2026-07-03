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

// ─── POST /api/issues 
export const createIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);

    const { title, description, category, priority, address } = req.body;

    let imageUrls = [];
    if (req.files?.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "SmartNepal/issues"),
        ),
      );
      // secure_url is an HTTPS Cloudinary CDN URL — safe to store and serve.
      imageUrls = results.map((r) => r.secure_url);
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || "low",
      location: { address: address || "" },
      images: imageUrls,
      author: req.user._id, // guaranteed by protect middleware
    });

    await issue.populate("author", "name email");

    res.status(201).json({ success: true, issue });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/issues 
export const getIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    // Run both queries in parallel — count doesn't depend on the data query.
    const [issues, total] = await Promise.all([
      Issue.find()
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // lean() returns plain JS objects — faster for read-only data
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

// ─── GET /api/issues/:id 
export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("author", "name  province")
      .lean();

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    res.status(200).json({ success: true, issue });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format",
      });
    }
    next(error);
  }
};
