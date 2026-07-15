import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be under 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password in queries by default
    },
    role: {
      type: String,
      enum: ["citizen", "admin", "field_worker", "super_admin"],
      default: "citizen",
    },
    phone: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
    },
    district: {
      type: String,
    },
    city: {
      type: String,
    },
    avatar: {
      type: String,
    },
    department: {
      type: String,
      enum: [
        "Road Maintenance",
        "Water Supply",
        "Sanitation",
        "Electrical",
        "Parks & Public Spaces",
        "General",
      ],
    },
    jurisdiction: {
      province: {
        type: String,
      },
      district: {
        type: String,
      },
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "ne"],
      default: "en",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({
  role: 1,
  "jurisdiction.province": 1,
  "jurisdiction.district": 1,
});

const User = mongoose.model("User", userSchema);

export default User;
