import Issue from "../models/Issue.js";

const MINIMUM_SAMPLE_SIZE = 10;

// ─── GET /api/public/scorecard/:province/:district? 
export const getPublicScorecard = async (req, res, next) => {
  try {
    const { province, district } = req.params;

    if (!province || province === "null" || province === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid province parameter" });
    }

    const isValidLocationValue = (v) => v && v !== "null" && v !== "undefined";
    const match = { "location.province": province };
    if (isValidLocationValue(district)) {
      match["location.district"] = district;
    }

    const [
      totalIssues,
      resolvedCount,
      issuesByStatus,
      issuesByCategory,
      resolutionTimeAgg,
      overdueCount,
    ] = await Promise.all([
      Issue.countDocuments(match),
      Issue.countDocuments({ ...match, status: "resolved" }),
      Issue.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),
      Issue.aggregate([
        { $match: match },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
      ]),
      Issue.aggregate([
        {
          $match: {
            ...match,
            status: "resolved",
            resolvedAt: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgHours: {
              $avg: {
                $divide: [
                  { $subtract: ["$resolvedAt", "$createdAt"] },
                  3_600_000,
                ],
              },
            },
          },
        },
      ]),
      Issue.countDocuments({
        ...match,
        slaDeadline: { $lt: new Date() },
        status: { $nin: ["resolved", "rejected"] },
      }),
    ]);

    const hasEnoughData = totalIssues >= MINIMUM_SAMPLE_SIZE;

    const resolutionRate =
      totalIssues > 0
        ? parseFloat(((resolvedCount / totalIssues) * 100).toFixed(1))
        : 0;

    const avgResolutionHours = resolutionTimeAgg[0]?.avgHours
      ? parseFloat(resolutionTimeAgg[0].avgHours.toFixed(1))
      : null;

    res.status(200).json({
      success: true,
      scorecard: {
        province,
        district: isValidLocationValue(district) ? district : null,
        hasEnoughData,
        minimumSampleSize: MINIMUM_SAMPLE_SIZE,
        totalIssues,
        resolvedCount,
        resolutionRate,
        avgResolutionHours,
        overdueCount,
        issuesByStatus,
        issuesByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/public/scorecard-directory 
export const getScorecardDirectory = async (req, res, next) => {
  try {
    const directory = await Issue.aggregate([
      {
        $match: {
          "location.province": { $exists: true, $ne: null, $nin: ["", "null", "undefined"] },
          "location.district": { $exists: true, $ne: null, $nin: ["", "null", "undefined"] },
        },
      },
      {
        $group: {
          _id: {
            province: "$location.province",
            district: "$location.district",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.province": 1, "_id.district": 1 } },
      {
        $project: {
          _id: 0,
          province: "$_id.province",
          district: "$_id.district",
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, directory });
  } catch (error) {
    next(error);
  }
};
