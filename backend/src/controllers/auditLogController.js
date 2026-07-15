import AuditLog from "../models/AuditLog.js";

// ─── GET /api/admin/audit-log
export const getAuditLog = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(
      1,
      Math.min(50, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;
    const { action, targetType } = req.query;

    const filter = {};
    if (req.user.role !== "super_admin") {
      const { province, district } = req.user.jurisdiction || {};
      filter["jurisdiction.province"] =
        province || "__NO_JURISDICTION_ASSIGNED__";
      if (district) filter["jurisdiction.district"] = district;
    }
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
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
