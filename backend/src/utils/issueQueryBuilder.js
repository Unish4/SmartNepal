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
