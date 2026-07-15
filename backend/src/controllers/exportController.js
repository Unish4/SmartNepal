import PDFDocument from "pdfkit";
import Issue from "../models/Issue.js";
import { buildIssueMatch } from "../utils/issueQueryBuilder.js";
import { toCSV } from "../utils/csvUtils.js";

// ─── GET /api/admin/export/csv 
export const exportIssuesCSV = async (req, res, next) => {
  try {
    const match = buildIssueMatch(req);
    const now = new Date();
    const columns = [
      { label: "Issue ID", value: (i) => i._id.toString() },
      { label: "Title", value: (i) => i.title },
      { label: "Category", value: (i) => i.category },
      { label: "Priority", value: (i) => i.priority },
      { label: "Status", value: (i) => i.status },
      { label: "Reporter", value: (i) => i.author?.name || "" },
      { label: "Reporter Email", value: (i) => i.author?.email || "" },
      { label: "Assigned To", value: (i) => i.assignedTo?.name || "" },
      { label: "Department", value: (i) => i.assignedTo?.department || "" },
      { label: "Province", value: (i) => i.location?.province || "" },
      { label: "District", value: (i) => i.location?.district || "" },
      { label: "Address", value: (i) => i.location?.address || "" },
      {
        label: "Created At",
        value: (i) => new Date(i.createdAt).toISOString(),
      },
      {
        label: "Resolved At",
        value: (i) =>
          i.resolvedAt ? new Date(i.resolvedAt).toISOString() : "",
      },
      {
        label: "SLA Deadline",
        value: (i) =>
          i.slaDeadline ? new Date(i.slaDeadline).toISOString() : "",
      },
      {
        label: "Overdue",
        value: (i) =>
          i.slaDeadline &&
          new Date(i.slaDeadline) < now &&
          !["resolved", "rejected"].includes(i.status)
            ? "Yes"
            : "No",
      },
    ];

    const filename = `smartnepal-issues-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.write("\uFEFF"); // Write UTF-8 BOM

    let hasHeadersBeenWritten = false;
    let skip = 0;
    const batchSize = 1000;

    while (true) {
      const issues = await Issue.find(match)
        .populate("author", "name email")
        .populate("assignedTo", "name department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (issues.length === 0) break;

      const csvChunk = toCSV(issues, columns);
      if (!hasHeadersBeenWritten) {
        res.write(csvChunk + "\r\n");
        hasHeadersBeenWritten = true;
      } else {
        const lines = csvChunk.split("\r\n");
        lines.shift(); // Remove headers
        if (lines.length > 0) {
          res.write(lines.join("\r\n") + "\r\n");
        }
      }

      skip += batchSize;
      if (issues.length < batchSize) break;
    }

    res.end();
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/export/pdf 
export const exportIssuesPDF = async (req, res, next) => {
  try {
    const match = buildIssueMatch(req);

    // Calculate complete counts from the entire matching database
    const [statusCountsArray, total] = await Promise.all([
      Issue.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Issue.countDocuments(match),
    ]);

    const statusCounts = statusCountsArray.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const resolutionRate =
      total > 0
        ? (((statusCounts.resolved || 0) / total) * 100).toFixed(1)
        : "0.0";

    const issues = await Issue.find(match)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const jurisdictionLabel =
      req.user.role === "super_admin"
        ? "All Municipalities"
        : `${req.user.jurisdiction?.district ? req.user.jurisdiction.district + ", " : ""}${req.user.jurisdiction?.province || "Unassigned"}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smartnepal-report-${new Date().toISOString().split("T")[0]}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor("#16a34a")
      .text("SmartNepal", { continued: true })
      .fillColor("#0f172a")
      .text(" — Civic Issue Report");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#64748b");
    doc.text(`Jurisdiction: ${jurisdictionLabel}`);
    doc.text(`Generated: ${new Date().toLocaleString("en-NP")}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#0f172a").text("Summary");
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#475569");
    doc.text(`Total issues: ${total}`);
    doc.text(`Resolution rate: ${resolutionRate}%`);
    Object.entries(statusCounts).forEach(([status, count]) =>
      doc.text(`  ${status}: ${count}`),
    );
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#0f172a").text("Issues");
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#475569");
    issues.slice(0, 200).forEach((issue) => {
      doc.text(
        `${issue.title} — ${issue.category} — ${issue.status} — ${new Date(issue.createdAt).toLocaleDateString("en-NP")}`,
      );
    });
    if (total > 200) {
      doc
        .moveDown(0.5)
        .fillColor("#94a3b8")
        .text(
          `...and ${total - 200} more matching records. Use the CSV export for the complete dataset (the CSV export contains all ${total} matching records).`,
        );
    } else {
      doc
        .moveDown(0.5)
        .fillColor("#94a3b8")
        .text(
          `This PDF contains the complete dataset of ${total} matching items.`,
        );
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
