import Issue from "../models/Issue.js";

// GET /api/admin/analytics?days=30
export const getAnalytics = async (req, res, next) => {
  try {
    const days = [7, 30, 90].includes(parseInt(req.query.days))
      ? parseInt(req.query.days)
      : 30;

    // Start of the time window — midnight on the correct day
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const filter = req.jurisdictionFilter || {};

    const [
      issuesByCategory,
      issuesByStatus,
      issuesByPriority,
      issuesOverTime,
      resolutionTimeByCategory,
      totalIssues,
      resolvedCount,
      costByCategoryAgg,
    ] = await Promise.all([
      // Total issues grouped by category — sorted highest first
      Issue.aggregate([
        { $match: { ...filter, createdAt: { $gte: startDate } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
      ]),

      // Total issues grouped by status
      Issue.aggregate([
        { $match: { ...filter, createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      // Total issues grouped by priority
      Issue.aggregate([
        { $match: { ...filter, createdAt: { $gte: startDate } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $project: { _id: 0, priority: "$_id", count: 1 } },
      ]),

      Issue.aggregate([
        { $match: { ...filter, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),

      Issue.aggregate([
        {
          $match: {
            ...filter,
            status: "resolved",
            resolvedAt: { $exists: true, $ne: null },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$category",
            avgHours: {
              $avg: {
                $divide: [
                  { $subtract: ["$resolvedAt", "$createdAt"] },
                  3_600_000,
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgHours: 1 } },
        {
          $project: {
            _id: 0,
            category: "$_id",
            avgHours: { $round: ["$avgHours", 1] },
            count: 1,
          },
        },
      ]),

      Issue.countDocuments({ ...filter, createdAt: { $gte: startDate } }),
      Issue.countDocuments({
        ...filter,
        status: "resolved",
        createdAt: { $gte: startDate },
      }),

      Issue.aggregate([
        // ← Phase 41
        {
          $match: {
            ...filter,
            status: "resolved",
            createdAt: { $gte: startDate },
            resolutionCost: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$category",
            totalCost: { $sum: "$resolutionCost" },
            avgCost: { $avg: "$resolutionCost" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalCost: -1 } },
        {
          $project: {
            _id: 0,
            category: "$_id",
            totalCost: { $round: ["$totalCost", 2] },
            avgCost: { $round: ["$avgCost", 2] },
            count: 1,
          },
        },
      ]),
    ]);
    const resolutionRate =
      totalIssues > 0
        ? parseFloat(((resolvedCount / totalIssues) * 100).toFixed(1))
        : 0;

    const totalResolved = resolutionTimeByCategory.reduce(
      (sum, r) => sum + r.count,
      0,
    );
    const avgResolutionHours =
      totalResolved > 0
        ? parseFloat(
            (
              resolutionTimeByCategory.reduce(
                (sum, r) => sum + r.avgHours * r.count,
                0,
              ) / totalResolved
            ).toFixed(1),
          )
        : null;

    const totalCost = parseFloat(
      costByCategoryAgg.reduce((sum, c) => sum + c.totalCost, 0).toFixed(2),
    );

    res.status(200).json({
      success: true,
      days,
      analytics: {
        issuesByCategory,
        issuesByStatus,
        issuesByPriority,
        issuesOverTime,
        resolutionTimeByCategory,
        totalIssues,
        resolvedCount,
        resolutionRate,
        avgResolutionHours,
        costByCategory: costByCategoryAgg,
        totalCost, // ← Phase 41
      },
    });
  } catch (error) {
    next(error);
  }
};
