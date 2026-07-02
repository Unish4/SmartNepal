import { validationResult } from "express-validator";
import Issue from "../models/Issue.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

export const createIssue = async (req, res, next) => {
  try {
    checkValidation(req, res);

    const { title, description, category, priority, location } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || "low",
      location: location || {},
      author: req.user._id,
    });

    await issue.populate("author", "name email");
    res.status(201).json({
      success: true,
      issue,
    });
  } catch (error) {
    next(error);
  }
};

export const getIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 12); // cap at 20

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      Issue.find()
        .populate("author", "name") // only fetch the name field from User
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit)
        .lean(), // .lean() returns plain JS objects — faster for read-only data
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

export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("author", "name province")
      .lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      issue,
    });
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
