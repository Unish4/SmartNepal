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

    const [
      issuesByCategory,
      issuesByStatus,
      issuesByPriority,
      issuesOverTime,
      resolutionTimeByCategory,
      totalIssues,
      resolvedCount,
    ] = await Promise.all([
      // Total issues grouped by category — sorted highest first
      Issue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
      ]),

      // Total issues grouped by status
      Issue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      // Total issues grouped by priority
      Issue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $project: { _id: 0, priority: "$_id", count: 1 } },
      ]),

      Issue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
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

      Issue.countDocuments({ createdAt: { $gte: startDate } }),
      Issue.countDocuments({
        status: "resolved",
        createdAt: { $gte: startDate },
      }),
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
      },
    });
  } catch (error) {
    next(error);
  }
};
