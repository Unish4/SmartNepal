import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
};

// ─── POST /api/admin/admins — super_admin only
export const createAdmin = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { name, email, password, province, district } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let admin;
    try {
      admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        jurisdiction: { province, district: district || undefined },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({
            success: false,
            message: "An account with this email already exists",
          });
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        jurisdiction: admin.jurisdiction,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
// ─── GET /api/admin/admins — super_admin only
export const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "super_admin"] } })
      .select("_id name email role jurisdiction createdAt")
      .sort({ "jurisdiction.province": 1, "jurisdiction.district": 1 })
      .lean();
    res.status(200).json({ success: true, admins });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/admins/:id/jurisdiction — super_admin only 
export const updateAdminJurisdiction = async (req, res, next) => {
  try {
    checkValidation(req, res);
    const { province, district } = req.body;

    const update = {
      "jurisdiction.province": province,
    };

    if (district?.trim()) {
      update["jurisdiction.district"] = district.trim();
    } else {
      update.$unset = { "jurisdiction.district": 1 };
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" }, // super_admin accounts are never re-scoped
      update,
      { new: true },
    ).select("_id name email role jurisdiction createdAt");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin account not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (error) {
    next(error);
  }
};
