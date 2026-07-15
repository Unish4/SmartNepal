import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [100, "Title must be at most 100 characters long"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters long"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Road Damage",
        "Garbage",
        "Water Issue",
        "Street Light",
        "Illegal Construction",
        "Public Space",
        "Other",
      ],
    },
    status: {
      type: String,
      enum: ["open", "verified", "in-progress", "resolved", "rejected"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      address: { type: String, trim: true, default: "" },
      lat: { type: Number },
      lng: { type: Number },
      province: { type: String, default: "" },
      district: { type: String, default: "" },
      municipality: { type: String, default: "" },
      ward: { type: String, default: "" },
    },
    images: [{ type: String, default: [] }],
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    upvoterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionProof: { type: [String], default: [] },
    aiCategory: { type: String },
    aiPriority: { type: String },
    aiConfidence: { type: Number },
    rejectionReason: { type: String },
    resolvedAt: { type: Date },
    slaDeadline: { type: Date },
    escalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
    escalationState: {
      type: String,
      enum: ["unmarked", "processing", "completed", "failed"],
      default: "unmarked",
    },
    escalationErrors: [
      {
        adminEmail: { type: String },
        error: { type: String },
        occurredAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

issueSchema.index({ "location.province": 1 });
issueSchema.index({ "location.district": 1 });
issueSchema.index({ "location.province": 1, "location.district": 1 });
issueSchema.index({ "location.province": 1, status: 1 });
issueSchema.index({ status: 1, category: 1 });
issueSchema.index({ author: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
issueSchema.index({ slaDeadline: 1, status: 1 });

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
