export const SLA_HOURS_BY_PRIORITY = {
  critical: 24,
  high: 72, // 3 days
  medium: 168, // 7 days
  low: 336, // 14 days
};

const URGENT_CATEGORIES = new Set(["Water Issue", "Road Damage"]);

export const computeSlaDeadline = (
  priority,
  category,
  createdAt = new Date(),
) => {
  let hours = SLA_HOURS_BY_PRIORITY[priority] ?? SLA_HOURS_BY_PRIORITY.low;

  if (
    URGENT_CATEGORIES.has(category) &&
    (priority === "critical" || priority === "high")
  ) {
    hours = Math.round(hours / 2);
  }

  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
};
