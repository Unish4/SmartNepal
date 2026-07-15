import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: { type: String, required: true },

    action: {
      type: String,
      enum: [
        "issue_status_change",
        "issue_assignment",
        "issue_deletion",
        "admin_created",
        "admin_jurisdiction_update",
        "field_worker_created",
      ],
      required: true,
    },

    targetType: { type: String, enum: ["Issue", "User"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    jurisdiction: {
      province: { type: String },
      district: { type: String },
    },

    details: { type: mongoose.Schema.Types.Mixed }, // e.g. { from: "open", to: "verified" }
  },
  { timestamps: true },
);

auditLogSchema.index({
  "jurisdiction.province": 1,
  "jurisdiction.district": 1,
  createdAt: -1,
});
auditLogSchema.index({ targetType: 1, targetId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
