const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DigitalSewa Notification</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Header band -->
          <tr>
            <td style="background:#15803d;padding:20px 28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ffffff20;border-radius:8px;padding:8px;width:32px;text-align:center;vertical-align:middle;">
                    <span style="font-size:16px;line-height:1;">📍</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                      Smart<span style="color:#86efac;">Nepal</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #f1f5f9;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                You are receiving this notification because you reported a civic issue
                via DigitalSewa.
                <br/>
                © ${new Date().getFullYear()} DigitalSewa · Serving citizens across 7 provinces of Nepal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Status badge HTML
const STATUS_STYLES = {
  verified: {
    bg: "#f5f3ff",
    text: "#6d28d9",
    dot: "#8b5cf6",
    label: "Verified",
  },
  "in-progress": {
    bg: "#fffbeb",
    text: "#b45309",
    dot: "#f59e0b",
    label: "In Progress",
  },
  resolved: {
    bg: "#f0fdf4",
    text: "#15803d",
    dot: "#22c55e",
    label: "Resolved",
  },
  rejected: {
    bg: "#fef2f2",
    text: "#b91c1c",
    dot: "#ef4444",
    label: "Rejected",
  },
};

const statusBadge = (status) => {
  const s = STATUS_STYLES[status];
  if (!s) return "";
  return `
    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
      border-radius:20px;font-size:13px;font-weight:600;
      background:${s.bg};color:${s.text};">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:${s.dot};"></span>
      ${s.label}
    </span>
  `;
};

// ── Shared issue title block
const issueTitleBlock = (title) => `
  <div style="background:#f8fafc;border-left:3px solid #16a34a;
    padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;">
      ${title}
    </p>
  </div>
`;

// ── CTA button
const ctaButton = (href, label) => `
  <a href="${href}" target="_blank"
    style="display:inline-block;background:#16a34a;color:#ffffff;
      padding:12px 24px;border-radius:8px;text-decoration:none;
      font-size:14px;font-weight:600;margin-top:8px;">
    ${label}
  </a>
`;

// ── Template 1: Verified
export const verifiedTemplate = (issue, frontendUrl) => ({
  subject: `✓ Your report has been verified — DigitalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Your report has been verified
    </p>
    ${statusBadge("verified")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Good news! A ward officer has reviewed and verified your report.
      It has been added to the municipality's work queue and will be
      assigned to the relevant department shortly.
    </p>
    ${issueTitleBlock(issue.title)}
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding-right:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;
            text-transform:uppercase;letter-spacing:0.5px;">Category</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;">
            ${issue.category}
          </p>
        </td>
        <td>
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;
            text-transform:uppercase;letter-spacing:0.5px;">Priority</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;
            text-transform:capitalize;">
            ${issue.priority}
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "View your report")}
  `),
});

// ── Template 2: In Progress
export const inProgressTemplate = (issue, frontendUrl) => ({
  subject: `🔧 Work has started on your report — DigitalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Work has started on your issue
    </p>
    ${statusBadge("in-progress")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      The relevant department has acknowledged your report and a crew
      has been dispatched to address it. You will be notified once
      the issue is resolved.
    </p>
    ${issueTitleBlock(issue.title)}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
      padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#b45309;font-weight:500;">
        ⏱ Estimated resolution time may vary by issue type and crew availability.
      </p>
    </div>
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "Track progress")}
  `),
});

// ── Template 3: Resolved
export const resolvedTemplate = (issue, frontendUrl) => ({
  subject: `🎉 Your issue has been resolved — DigitalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Your issue has been resolved!
    </p>
    ${statusBadge("resolved")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Great news — the municipality has fixed the issue you reported.
      Thank you for helping make Nepal better. Your report made a real difference.
    </p>
    ${issueTitleBlock(issue.title)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
      padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#15803d;font-weight:500;">
        If the issue has not actually been resolved, you can reopen it
        from your report page.
      </p>
    </div>
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "View resolved report")}
  `),
});

// ── Template 4: Rejected
export const rejectedTemplate = (issue, rejectionReason, frontendUrl) => ({
  subject: `Your report could not be actioned — DigitalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Your report could not be actioned
    </p>
    ${statusBadge("rejected")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      After review, the ward officer was unable to action your report.
      This may be because it is a duplicate of an existing report,
      outside the municipality's jurisdiction, or does not meet the
      reporting criteria.
    </p>
    ${issueTitleBlock(issue.title)}
    ${
      rejectionReason
        ? `
      <div style="background:#fef2f2;border-left:3px solid #ef4444;
        border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b91c1c;
          text-transform:uppercase;letter-spacing:0.5px;">
          Reason provided
        </p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">
          ${rejectionReason}
        </p>
      </div>
    `
        : ""
    }
    <p style="font-size:13px;color:#94a3b8;margin:16px 0 8px;">
      You are welcome to submit a new report if the issue persists
      or if you have additional information.
    </p>
    ${ctaButton(`${frontendUrl}/issues/new`, "Submit a new report")}
  `),
});

// - Template 5: New assignment for field worker
export const assignedTemplate = (issue, frontendUrl) => ({
  subject: `📋 New assignment: ${issue.title.slice(0, 60)} — SmartNepal`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      You have a new assignment
    </p>
    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
      border-radius:20px;font-size:13px;font-weight:600;
      background:#fffbeb;color:#b45309;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:#f59e0b;"></span>
      New Assignment
    </span>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      A municipal admin has assigned the following civic issue to you.
      Please review the details and begin work when ready.
    </p>
    <div style="background:#f8fafc;border-left:3px solid #f59e0b;
      padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;">
        ${issue.title}
      </p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding-right:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;
            text-transform:uppercase;letter-spacing:0.5px;">Category</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;">
            ${issue.category}
          </p>
        </td>
        <td>
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;
            text-transform:uppercase;letter-spacing:0.5px;">Priority</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;
            text-transform:capitalize;">
            ${issue.priority}
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton(`${frontendUrl}/field/assignments/${issue._id}`, "View assignment")}
  `),
});
