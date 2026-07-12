import nodemailer from "nodemailer";
import ENV from "../config/env.js";
import Issue from "../models/Issue.js";
import {
  verifiedTemplate,
  inProgressTemplate,
  resolvedTemplate,
  rejectedTemplate,
  assignedTemplate,
} from "./emailTemplates.js";
import User from "../models/User.js";

// ── Transporter
let transporter = null;

if (ENV.GMAIL_USER && ENV.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.GMAIL_USER,
      pass: ENV.GMAIL_APP_PASSWORD,
    },
  });

  // Verify credentials at startup so misconfigured Gmail fails loudly
  // in the server log rather than silently on the first real email attempt.
  transporter.verify((error) => {
    if (error) {
      console.error("Gmail SMTP verification failed:", error.message);
      transporter = null; // Disable sends so bad config doesn't spray error logs
    } else {
      console.log("Gmail SMTP ready — email notifications enabled");
    }
  });
}

// ── Low-level send
const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) return; // Email not configured — skip silently

  await transporter.sendMail({
    from: `"DigitalSewa 📍" <${ENV.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ── Status change email
export const sendStatusChangeEmail = async (
  issueId,
  newStatus,
  rejectionReason,
) => {
  // Only these four statuses warrant an email — "open" is the initial state
  // and is never transitioned TO from the admin panel.
  const NOTIFIABLE_STATUSES = [
    "verified",
    "in-progress",
    "resolved",
    "rejected",
  ];
  if (!NOTIFIABLE_STATUSES.includes(newStatus)) return;

  // Fetch fresh issue data with author email.
  // We refetch rather than relying on the caller's data because the issue
  // was just updated and we want the latest state including author info.
  const issue = await Issue.findById(issueId)
    .populate("author", "name email emailNotifications")
    .lean();

  // Guard clauses — skip silently in each case
  if (!issue) return; // Issue deleted mid-flight
  if (!issue.author?.email) return; // No email address on record
  if (!issue.author?.emailNotifications) return; // User opted out of emails

  // Build the frontend URL used in CTA buttons.
  // CLIENT_URL is the deployed Vercel URL in production.
  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";

  // Select the template based on the new status.
  let emailData;
  switch (newStatus) {
    case "verified":
      emailData = verifiedTemplate(issue, frontendUrl);
      break;
    case "in-progress":
      emailData = inProgressTemplate(issue, frontendUrl);
      break;
    case "resolved":
      emailData = resolvedTemplate(issue, frontendUrl);
      break;
    case "rejected":
      emailData = rejectedTemplate(issue, rejectionReason, frontendUrl);
      break;
    default:
      return;
  }

  await sendEmail({ to: issue.author.email, ...emailData });
  console.log(`Email sent to ${issue.author.email} — status: ${newStatus}`);
};

export const sendAssignmentEmail = async (issueId, fieldWorkerId) => {
  const [issue, fieldWorker] = await Promise.all([
    Issue.findById(issueId).lean(),
    User.findById(fieldWorkerId).select("name email emailNotifications").lean(),
  ]);

  if (!issue) return; // Issue deleted mid-flight
  if (!fieldWorker?.email) return; // No email on record — skip silently
  if (!fieldWorker.emailNotifications) return; // User opted out of emails

  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";
  const emailData = assignedTemplate(issue, frontendUrl);

  await sendEmail({ to: fieldWorker.email, ...emailData });
  console.log(
    `Assignment email sent to ${fieldWorker.email} for issue ${issueId}`,
  );
};
