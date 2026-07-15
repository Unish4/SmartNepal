export const isOverdue = (issue) => {
  if (!issue.slaDeadline) return false;
  if (["resolved", "rejected"].includes(issue.status)) return false;
  return new Date(issue.slaDeadline) < new Date();
};
