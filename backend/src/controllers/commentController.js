import { validationResult } from "express-validator";
import Comment from "../models/Comment.js";
import Issue from "../models/Issue.js";
import { notify } from "../services/notificationService.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

// ─── GET /api/issues/:id/comments 
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ issue: req.params.id })
      .populate("author", "name role")
      .sort({ createdAt: 1 })
      .lean();
    res.status(200).json({ success: true, comments });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── POST /api/issues/:id/comments 
export const createComment = async (req, res, next) => {
  try {
    checkValidation(req, res);

    const issue = await Issue.findById(req.params.id).select("title author");
    if (!issue)
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });

    const comment = await Comment.create({
      issue: req.params.id,
      author: req.user._id,
      text: req.body.text,
    });
    await comment.populate("author", "name role");

    if (issue.author.toString() !== req.user._id.toString()) {
      notify({
        recipient: issue.author,
        type: "comment",
        title: "New comment on your report",
        message: `${req.user.name} commented on "${issue.title}"`,
        link: `/issues/${issue._id}`,
      }).catch((err) =>
        console.error(`Comment notification failed: ${err.message}`),
      );
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── DELETE /api/issues/:id/comments/:commentId 
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isModerator = ["admin", "super_admin"].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this comment",
        });
    }

    await comment.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID format" });
    }
    next(error);
  }
};
