import Issue from "../models/Issue.js";
import { buildIssuePipelineStart } from "../utils/issueQueryBuilder.js";
import { PUBLIC_CATEGORIES } from "../utils/publicCategories.js";

const MAX_PUBLIC_LIMIT = 25;

// ─── GET /api/public/v1/issues
export const getPublicIssues = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? MAX_PUBLIC_LIMIT);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "page and limit must be positive integers",
      });
    }

    const limit = Math.min(MAX_PUBLIC_LIMIT, requestedLimit);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "page is too large",
      });
    }
    const sort = req.query.sort;

    const sortStage = {
      oldest: { createdAt: 1, _id: 1 },
      "most-upvoted": { upvoteCount: -1, _id: -1 },
    }[sort] ?? { createdAt: -1, _id: -1 };

    const pipelineStart = buildIssuePipelineStart(req);

    const [issues, countResult] = await Promise.all([
      Issue.aggregate([
        ...pipelineStart,
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
            pipeline: [{ $project: { name: 1 } }], // never email, never anything else
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
            priority: 1,
            status: 1,
            images: 1,
            upvoteCount: 1,
            createdAt: 1,
            resolvedAt: 1,
            "location.province": 1,
            "location.district": 1,
            "location.lat": 1,
            "location.lng": 1,
            "author.name": 1,
          },
        },
      ]),
      Issue.aggregate([...pipelineStart, { $count: "total" }]),
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

// ─── GET /api/public/v1/issues/:id
export const getPublicIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("author", "name")
      .select(
        `
        title description category priority status images
        location.province location.district location.lat location.lng
        createdAt resolvedAt upvoterIds
      `,
      )
      .lean();

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // upvoterIds is fetched only to compute a count, then discarded —
    // never sent to the client as a raw array of citizen ObjectIds.
    const { upvoterIds, ...publicIssue } = issue;
    publicIssue.upvoteCount = upvoterIds?.length ?? 0;

    res.status(200).json({ success: true, issue: publicIssue });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid issue ID format" });
    }
    next(error);
  }
};

// ─── GET /api/public/v1/categories
export const getPublicCategoriesList = (req, res) => {
  res.status(200).json({ success: true, categories: PUBLIC_CATEGORIES });
};

// ─── GET /api/public/v1/stats
export const getPublicPlatformStats = async (req, res, next) => {
  try {
    const [totalIssues, resolvedCount, issuesByCategory, issuesByStatus] =
      await Promise.all([
        Issue.countDocuments(),
        Issue.countDocuments({ status: "resolved" }),
        Issue.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, category: "$_id", count: 1 } },
        ]),
        Issue.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ]),
      ]);

    const resolutionRate =
      totalIssues > 0
        ? parseFloat(((resolvedCount / totalIssues) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        resolvedCount,
        resolutionRate,
        issuesByCategory,
        issuesByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
