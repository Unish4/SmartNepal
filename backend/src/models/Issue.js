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
      address: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
      ward: { type: String },
      district: { type: String },
      province: { type: String },
    },
    images: [{ type: String }],
    upvoterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    aiCategory: { type: String },
    aiPriority: { type: String },
    aiConfidence: { type: Number },
    rejectionReason: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

issueSchema.index({ status: 1, category: 1 });

// Index on author for "my issues" queries (Phase 7).
issueSchema.index({ author: 1 });

// Index on createdAt for the default newest-first sort.
issueSchema.index({ createdAt: -1 });

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
