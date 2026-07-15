const baseWrapper = (content, lang = "en") => {
  const footerText =
    lang === "ne"
      ? `तपाईंले यो सूचना पाउनुभएको छ किनभने तपाईंले नेपाल सेवा मार्फत नागरिक समस्या रिपोर्ट गर्नुभएको थियो।
       <br/>© ${new Date().getFullYear()} नेपाल सेवा · नेपालका ७ प्रदेशका नागरिकहरूलाई सेवा दिँदै।`
      : `You are receiving this notification because you reported a civic issue
       via NepalSewa.
       <br/>© ${new Date().getFullYear()} NepalSewa · Serving citizens across 7 provinces of Nepal.`;

  const brandName = lang === "ne" ? "नेपाल सेवा" : "NepalSewa";

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brandName} Notification</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;
  font-family:${lang === "ne" ? "'Noto Sans Devanagari'," : ""}Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #f1f5f9;background:#ffffff;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="cid:logo" alt="Logo" width="32" height="32" style="display:block;border:0;border-radius:6px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">
                      ${brandName}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #f1f5f9;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                ${footerText}
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
};

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

// ne label overrides — used only when lang === "ne"
const STATUS_LABELS_NE = {
  verified: "प्रमाणित",
  "in-progress": "प्रगतिमा",
  resolved: "समाधान भयो",
  rejected: "अस्वीकृत",
};

const statusBadge = (status, lang = "en") => {
  const s = STATUS_STYLES[status];
  if (!s) return "";
  const label = lang === "ne" ? STATUS_LABELS_NE[status] : s.label;
  return `
    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
      border-radius:20px;font-size:13px;font-weight:600;
      background:${s.bg};color:${s.text};">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:${s.dot};"></span>
      ${label}
    </span>
  `;
};

const issueTitleBlock = (title) => `
  <div style="background:#f8fafc;border-left:3px solid #16a34a;
    padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;">
      ${title}
    </p>
  </div>
`;

const ctaButton = (href, label) => `
  <a href="${href}" target="_blank"
    style="display:inline-block;background:#16a34a;color:#ffffff;
      padding:12px 24px;border-radius:8px;text-decoration:none;
      font-size:14px;font-weight:600;margin-top:8px;">
    ${label}
  </a>
`;

export const verifiedTemplate = (issue, frontendUrl) => ({
  subject: `Your report has been verified — NepalSewa`,
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
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "View your report")}
  `),
});

export const inProgressTemplate = (issue, frontendUrl) => ({
  subject: `Work has started on your report — NepalSewa`,
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
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "Track progress")}
  `),
});

export const resolvedTemplate = (issue, frontendUrl) => ({
  subject: `Your issue has been resolved — NepalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Your issue has been resolved!
    </p>
    ${statusBadge("resolved")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Great news — the municipality has fixed the issue you reported.
      Thank you for helping make Nepal better.
    </p>
    ${issueTitleBlock(issue.title)}
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "View resolved report")}
  `),
});

export const rejectedTemplate = (issue, rejectionReason, frontendUrl) => ({
  subject: `Your report could not be actioned — NepalSewa`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Your report could not be actioned
    </p>
    ${statusBadge("rejected")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      After review, the ward officer was unable to action your report.
    </p>
    ${issueTitleBlock(issue.title)}
    ${
      rejectionReason
        ? `
      <div style="background:#fef2f2;border-left:3px solid #ef4444;
        border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b91c1c;
          text-transform:uppercase;letter-spacing:0.5px;">Reason provided</p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">${rejectionReason}</p>
      </div>
    `
        : ""
    }
    ${ctaButton(`${frontendUrl}/issues/new`, "Submit a new report")}
  `),
});

export const assignedTemplate = (issue, frontendUrl) => ({
  subject: `New assignment: ${issue.title.slice(0, 60)} — NepalSewa`,
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

export const verificationTemplate = (user, verifyUrl) => ({
  subject: `Verify your NepalSewa email address`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Welcome to NepalSewa, ${user.name}
    </p>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Please verify your email address so your municipality knows your reports
      come from a real, reachable account. This link expires in 24 hours.
    </p>
    ${ctaButton(verifyUrl, "Verify Email")}
  `),
});

export const passwordResetTemplate = (user, resetUrl) => ({
  subject: `Reset your NepalSewa password`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      Reset your password
    </p>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Hi ${user.name}, we received a request to reset your NepalSewa password.
      Click the button below to choose a new one. This link expires in 1 hour.
    </p>
    ${ctaButton(resetUrl, "Reset Password")}
    <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
      If you didn't request this, you can safely ignore this email — your password will not change.
    </p>
  `),
});

// ── Template: SLA Escalation
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

export const escalationTemplate = (admin, issue, frontendUrl) => ({
  subject: `⚠ SLA breached: ${issue.title.slice(0, 60)} — SmartNepal`,
  html: baseWrapper(`
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      An issue has passed its SLA deadline
    </p>
    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
      border-radius:20px;font-size:13px;font-weight:600;background:#fef2f2;color:#b91c1c;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;"></span>
      SLA Breached
    </span>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Hi ${escapeHtml(admin.name)}, this report in your jurisdiction has not been resolved within
      its expected response window and needs attention.
    </p>
    <div style="background:#f8fafc;border-left:3px solid #ef4444;
      padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.5;">${escapeHtml(issue.title)}</p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding-right:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Category</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;">${issue.category}</p>
        </td>
        <td style="padding-right:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Priority</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;text-transform:capitalize;">${issue.priority}</p>
        </td>
        <td>
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;text-transform:capitalize;">${issue.status}</p>
        </td>
      </tr>
    </table>
    ${ctaButton(`${frontendUrl}/admin/issues`, "Review in Admin Panel")}  `),
});

// Nepalese templates

export const verifiedTemplateNe = (issue, frontendUrl) => ({
  subject: `तपाईंको रिपोर्ट प्रमाणित भयो — नेपाल सेवा`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      तपाईंको रिपोर्ट प्रमाणित भयो
    </p>
    ${statusBadge("verified", "ne")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      राम्रो खबर! वडा अधिकारीले तपाईंको रिपोर्ट समीक्षा र प्रमाणित गर्नुभएको छ।
      यो नगरपालिकाको कार्य सूचीमा थपिएको छ र चाँडै सम्बन्धित विभागलाई तोकिनेछ।
    </p>
    ${issueTitleBlock(issue.title)}
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "आफ्नो रिपोर्ट हेर्नुहोस्")}
  `,
    "ne",
  ),
});

export const inProgressTemplateNe = (issue, frontendUrl) => ({
  subject: `तपाईंको रिपोर्टमा काम सुरु भयो — नेपाल सेवा`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      तपाईंको समस्यामा काम सुरु भयो
    </p>
    ${statusBadge("in-progress", "ne")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      सम्बन्धित विभागले तपाईंको रिपोर्ट स्वीकार गरेको छ र समाधान गर्न टोली खटाइएको छ।
      समस्या समाधान भएपछि तपाईंलाई सूचित गरिनेछ।
    </p>
    ${issueTitleBlock(issue.title)}
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "प्रगति हेर्नुहोस्")}
  `,
    "ne",
  ),
});

export const resolvedTemplateNe = (issue, frontendUrl) => ({
  subject: `तपाईंको समस्या समाधान भयो — नेपाल सेवा`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      तपाईंको समस्या समाधान भयो!
    </p>
    ${statusBadge("resolved", "ne")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      राम्रो खबर — नगरपालिकाले तपाईंले रिपोर्ट गर्नुभएको समस्या समाधान गरेको छ।
      नेपाललाई राम्रो बनाउन मद्दत गर्नुभएकोमा धन्यवाद।
    </p>
    ${issueTitleBlock(issue.title)}
    ${ctaButton(`${frontendUrl}/issues/${issue._id}`, "समाधान भएको रिपोर्ट हेर्नुहोस्")}
  `,
    "ne",
  ),
});

export const rejectedTemplateNe = (issue, rejectionReason, frontendUrl) => ({
  subject: `तपाईंको रिपोर्टमा कारबाही गर्न सकिएन — नेपाल सेवा`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      तपाईंको रिपोर्टमा कारबाही गर्न सकिएन
    </p>
    ${statusBadge("rejected", "ne")}
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      समीक्षा पछि, वडा अधिकारीले तपाईंको रिपोर्टमा कारबाही गर्न सक्नुभएन।
    </p>
    ${issueTitleBlock(issue.title)}
    ${
      rejectionReason
        ? `
      <div style="background:#fef2f2;border-left:3px solid #ef4444;
        border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#b91c1c;
          text-transform:uppercase;letter-spacing:0.5px;">दिइएको कारण</p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.9;">${rejectionReason}</p>
      </div>
    `
        : ""
    }
    ${ctaButton(`${frontendUrl}/issues/new`, "नयाँ रिपोर्ट पेश गर्नुहोस्")}
  `,
    "ne",
  ),
});

export const assignedTemplateNe = (issue, frontendUrl) => ({
  subject: `नयाँ जिम्मेवारी: ${issue.title.slice(0, 60)} — नेपाल सेवा`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      तपाईंलाई नयाँ जिम्मेवारी दिइएको छ
    </p>
    <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
      border-radius:20px;font-size:13px;font-weight:600;
      background:#fffbeb;color:#b45309;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
        background:#f59e0b;"></span>
      नयाँ जिम्मेवारी
    </span>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      नगरपालिकाका प्रशासकले तलको नागरिक समस्या तपाईंलाई तोक्नुभएको छ।
      कृपया विवरण हेरेर काम सुरु गर्नुहोस्।
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
            text-transform:uppercase;letter-spacing:0.5px;">श्रेणी</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;">
            ${issue.category}
          </p>
        </td>
        <td>
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;
            text-transform:uppercase;letter-spacing:0.5px;">प्राथमिकता</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:500;
            text-transform:capitalize;">
            ${issue.priority}
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton(`${frontendUrl}/field/assignments/${issue._id}`, "जिम्मेवारी हेर्नुहोस्")}
  `,
    "ne",
  ),
});

export const verificationTemplateNe = (user, verifyUrl) => ({
  subject: `आफ्नो स्मार्टनेपाल इमेल प्रमाणित गर्नुहोस्`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      स्मार्टनेपालमा स्वागत छ, ${user.name}
    </p>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      कृपया आफ्नो इमेल ठेगाना प्रमाणित गर्नुहोस् ताकि तपाईंको नगरपालिकालाई थाहा होस्
      कि तपाईंको रिपोर्ट एक वास्तविक, सम्पर्क गर्न सकिने खाताबाट आएको हो।
      यो लिङ्क २४ घण्टामा समाप्त हुनेछ।
    </p>
    ${ctaButton(verifyUrl, "इमेल प्रमाणित गर्नुहोस्")}
  `,
    "ne",
  ),
});

export const passwordResetTemplateNe = (user, resetUrl) => ({
  subject: `आफ्नो स्मार्टनेपाल पासवर्ड रिसेट गर्नुहोस्`,
  html: baseWrapper(
    `
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">
      आफ्नो पासवर्ड रिसेट गर्नुहोस्
    </p>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.9;">
      नमस्ते ${user.name}, हामीले तपाईंको स्मार्टनेपाल पासवर्ड रिसेट गर्ने अनुरोध प्राप्त गर्यौं।
      नयाँ पासवर्ड छान्न तलको बटन थिच्नुहोस्। यो लिङ्क १ घण्टामा समाप्त हुनेछ।
    </p>
    ${ctaButton(resetUrl, "पासवर्ड रिसेट गर्नुहोस्")}
    <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
      यदि तपाईंले यो अनुरोध गर्नुभएको छैन भने, यो इमेललाई बेवास्ता गर्न सक्नुहुन्छ।
    </p>
  `,
    "ne",
  ),
});
