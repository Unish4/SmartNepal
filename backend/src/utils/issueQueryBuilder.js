import { buildSearchPipelineStages } from "../services/searchService.js";

export const buildOtherFilters = (req) => {
  const { category, status, priority, province, district, overdue } = req.query;
  const match = { ...(req.jurisdictionFilter || {}) };

  if (category) match.category = category;
  if (status) match.status = status;
  if (priority) match.priority = priority;

  if (overdue === "true") {
    match.slaDeadline = { $lt: new Date() };
    match.status = { $nin: ["resolved", "rejected"] };
  }

  const isJurisdictionLocked =
    req.user?.role === "admin" || req.user?.role === "field_worker";
  if (!isJurisdictionLocked) {
    if (province) match["location.province"] = province;
    if (district) match["location.district"] = district;
  }

  return match;
};

export const buildIssuePipelineStart = (req) =>
  buildSearchPipelineStages(req.query.search, buildOtherFilters(req));

export const buildIssueMatch = (req) => {
  const { search, category, status, priority, province, district, overdue } =
    req.query;

  const match = { ...req.jurisdictionFilter };

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }
  if (category) match.category = category;
  if (status) match.status = status;
  if (priority) match.priority = priority;

  if (overdue === "true") {
    match.slaDeadline = { $lt: new Date() };
    match.status = { $nin: ["resolved", "rejected"] };
  }

  if (req.user.role === "super_admin") {
    if (province) match["location.province"] = province;
    if (district) match["location.district"] = district;
  }

  return match;
};
