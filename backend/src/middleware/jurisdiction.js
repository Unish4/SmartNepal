import logger from "../config/logger.js";

export const scopeToMunicipality = (req, res, next) => {
  if (req.user.role === "super_admin") {
    req.jurisdictionFilter = {};
    return next();
  }

  const { province, district } = req.user.jurisdiction || {};

  if (!province) {
    logger.warn(
      { userId: req.user._id },
      "Admin has no jurisdiction assigned — scoping to zero results",
    );
    req.jurisdictionFilter = {
      "location.province": "__NO_JURISDICTION_ASSIGNED__",
    };
    return next();
  }

  req.jurisdictionFilter = district
    ? { "location.province": province, "location.district": district }
    : { "location.province": province };

  next();
};
