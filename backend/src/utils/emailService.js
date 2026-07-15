import nodemailer from "nodemailer";
import ENV from "../config/env.js";
import Issue from "../models/Issue.js";
import {
  verifiedTemplate,
  inProgressTemplate,
  resolvedTemplate,
  rejectedTemplate,
  assignedTemplate,
  passwordResetTemplate,
  verificationTemplate,
  passwordResetTemplateNe,
  verificationTemplateNe,
  assignedTemplateNe,
  inProgressTemplateNe,
  rejectedTemplateNe,
  resolvedTemplateNe,
  verifiedTemplateNe,
} from "./emailTemplates.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { escalationTemplate } from "./emailTemplates.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../../../frontend/public/icon.png");

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

  const attachments = [];
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: "icon.png",
      path: logoPath,
      cid: "logo",
    });
  }

  await transporter.sendMail({
    from: `"NepalSewa" <${ENV.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
};

// ── Status change email
export const sendStatusChangeEmail = async (
  issueId,
  newStatus,
  rejectionReason,
) => {
  const NOTIFIABLE_STATUSES = [
    "verified",
    "in-progress",
    "resolved",
    "rejected",
    "assigned",
  ];
  if (!NOTIFIABLE_STATUSES.includes(newStatus)) return;

  const issue = await Issue.findById(issueId)
    .populate("author", "name email emailNotifications preferredLanguage")
    .lean();

  if (!issue) return; // Issue deleted mid-flight
  if (!issue.author?.email) return; // No email address on record
  if (!issue.author?.emailNotifications) return; // User opted out of emails

  const lang = issue.author?.preferredLanguage || "en";
  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";

  // Select the template based on the new status.
  let emailData;
  switch (newStatus) {
    case "verified":
      emailData =
        lang === "ne"
          ? verifiedTemplateNe(issue, frontendUrl)
          : verifiedTemplate(issue, frontendUrl);
      break;
    case "in-progress":
      emailData =
        lang === "ne"
          ? inProgressTemplateNe(issue, frontendUrl)
          : inProgressTemplate(issue, frontendUrl);
      break;
    case "resolved":
      emailData =
        lang === "ne"
          ? resolvedTemplateNe(issue, frontendUrl)
          : resolvedTemplate(issue, frontendUrl);
      break;
    case "rejected":
      emailData =
        lang === "ne"
          ? rejectedTemplateNe(issue, rejectionReason, frontendUrl)
          : rejectedTemplate(issue, rejectionReason, frontendUrl);
      break;
    case "assigned":
      emailData =
        lang === "ne"
          ? assignedTemplateNe(issue, frontendUrl)
          : assignedTemplate(issue, frontendUrl);
      break;
    default:
      return;
  }

  await sendEmail({ to: issue.author.email, ...emailData });
  console.log(
    `Email sent to ${issue.author.email} — status: ${newStatus} [${lang}]`,
  );
};

export const sendAssignmentEmail = async (issueId, fieldWorkerId) => {
  const [issue, fieldWorker] = await Promise.all([
    Issue.findById(issueId).lean(),
    User.findById(fieldWorkerId)
      .select("name email emailNotifications preferredLanguage")
      .lean(),
  ]);

  if (!issue) return; // Issue deleted mid-flight
  if (!fieldWorker?.email) return; // No email on record — skip silently
  if (!fieldWorker.emailNotifications) return; // User opted out of emails

  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";
  const emailData =
    fieldWorker.preferredLanguage === "ne"
      ? assignedTemplateNe(issue, frontendUrl)
      : assignedTemplate(issue, frontendUrl);

  await sendEmail({ to: fieldWorker.email, ...emailData });
  console.log(
    `Assignment email sent to ${fieldWorker.email} for issue ${issueId}`,
  );
};

export const sendPasswordResetEmail = async (user, rawToken) => {
  if (!user?.email) return;
  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
  const lang = user.preferredLanguage === "ne" ? "ne" : "en";
  const emailData =
    lang === "ne"
      ? passwordResetTemplateNe(user, resetUrl)
      : passwordResetTemplate(user, resetUrl);
  await sendEmail({ to: user.email, ...emailData });
  logger.info({ userId: user._id }, "Password reset email sent");
};

// ── Email verification email
export const sendVerificationEmail = async (user, rawToken) => {
  if (!user?.email) return;
  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${frontendUrl}/verify-email/${rawToken}`;
  const lang = user.preferredLanguage === "ne" ? "ne" : "en";
  const emailData =
    lang === "ne"
      ? verificationTemplateNe(user, verifyUrl)
      : verificationTemplate(user, verifyUrl);
  await sendEmail({ to: user.email, ...emailData });
  logger.info({ userId: user._id }, "Verification email sent");
};


// ── Escalation email 
export const sendEscalationEmail = async (admin, issue) => {
  if (!admin?.email) return;
  const frontendUrl = ENV.CLIENT_URL || "http://localhost:5173";
  const emailData = escalationTemplate(admin, issue, frontendUrl);
  await sendEmail({ to: admin.email, ...emailData });
};