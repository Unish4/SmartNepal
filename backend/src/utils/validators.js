import { body } from "express-validator";

const VALID_PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const PROVINCE_DISTRICT_MAP = {
  "Koshi Province": [
    "Bhojpur",
    "Dhankuta",
    "Ilam",
    "Jhapa",
    "Khotang",
    "Morang",
    "Okhaldhunga",
    "Panchthar",
    "Sankhuwasabha",
    "Solukhumbu",
    "Sunsari",
    "Taplejung",
    "Terhathum",
    "Udayapur",
  ],
  "Madhesh Province": [
    "Bara",
    "Dhanusha",
    "Mahottari",
    "Parsa",
    "Rautahat",
    "Saptari",
    "Sarlahi",
    "Siraha",
  ],
  "Bagmati Province": [
    "Bhaktapur",
    "Chitwan",
    "Dhading",
    "Dolakha",
    "Kathmandu",
    "Kavrepalanchok",
    "Lalitpur",
    "Makwanpur",
    "Nuwakot",
    "Ramechhap",
    "Rasuwa",
    "Sindhuli",
    "Sindhupalchok",
  ],
  "Gandaki Province": [
    "Baglung",
    "Gorkha",
    "Kaski",
    "Lamjung",
    "Manang",
    "Mustang",
    "Myagdi",
    "Nawalpur",
    "Parbat",
    "Syangja",
    "Tanahun",
  ],
  "Lumbini Province": [
    "Arghakhanchi",
    "Banke",
    "Bardiya",
    "Dang",
    "Gulmi",
    "Kapilvastu",
    "Nawalparasi West",
    "Palpa",
    "Pyuthan",
    "Rolpa",
    "Rukum East",
    "Rupandehi",
  ],
  "Karnali Province": [
    "Dailekh",
    "Dolpa",
    "Humla",
    "Jajarkot",
    "Jumla",
    "Kalikot",
    "Mugu",
    "Rukum West",
    "Salyan",
    "Surkhet",
  ],
  "Sudurpashchim Province": [
    "Achham",
    "Baitadi",
    "Bajhang",
    "Bajura",
    "Dadeldhura",
    "Darchula",
    "Doti",
    "Kailali",
    "Kanchanpur",
  ],
};

const validateDistrictForProvince = (district, { req }) => {
  const province = req.body.province;
  if (!province) return true;
  const validDistricts = PROVINCE_DISTRICT_MAP[province];
  if (!validDistricts) return true;
  if (district && !validDistricts.includes(district)) {
    throw new Error(`District '${district}' is not valid for '${province}'`);
  }
  return true;
};

// ─── Auth validators
export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters")
    // Prevent names with only special characters
    .matches(/^[a-zA-Z\u0900-\u097F\s'-]+$/)
    .withMessage(
      "Name may only contain letters, spaces, hyphens, or apostrophes",
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 100 })
    .withMessage("Email is too long")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 72 })
    // bcrypt silently truncates passwords over 72 bytes — cap it here so
    // users aren't surprised that "password123..." and "password456..." are the same.
    .withMessage("Password must be between 6 and 72 characters"),

  // Phone is optional but if provided must be a valid Nepali number:
  // 10 digits, starting with 9 (mobile) or 0 (landline prefix).
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("province")
    .optional({ checkFalsy: true })
    .trim()
    .isIn([
      "Koshi Province",
      "Madhesh Province",
      "Bagmati Province",
      "Gandaki Province",
      "Lumbini Province",
      "Karnali Province",
      "Sudurpashchim Province",
    ])
    .withMessage("Invalid province"),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const updatePreferencesValidator = [
  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("emailNotifications must be a boolean"),

  body("preferredLanguage")
    .optional()
    .isIn(["en", "ne"])
    .withMessage("preferredLanguage must be either 'en' or 'ne'"),
];

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters")
    .matches(/^[a-zA-Z\u0900-\u097F\s'-]+$/)
    .withMessage(
      "Name may only contain letters, spaces, hyphens, or apostrophes",
    ),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("province")
    .optional({ checkFalsy: true })
    .trim()
    .isIn([
      "Koshi Province",
      "Madhesh Province",
      "Bagmati Province",
      "Gandaki Province",
      "Lumbini Province",
      "Karnali Province",
      "Sudurpashchim Province",
    ])
    .withMessage("Invalid province"),

  body("district")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("District cannot be empty")
    .custom(validateDistrictForProvince),

  body("city")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty"),

  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
];

// ─── Issue validators
const VALID_CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Water Issue",
  "Street Light",
  "Illegal Construction",
  "Public Space",
  "Other",
];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export const createIssueValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`),

  body("priority")
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage("Invalid priority value"),

  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address is too long"),

  body("lat")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("lng")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];

export const updateIssueValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("category")
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`),

  body("priority")
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage("Invalid priority value"),

  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address is too long"),

  body("lat")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("lng")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];

// ─── Admin status update validator
export const statusUpdateValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["open", "verified", "in-progress", "resolved", "rejected"])
    .withMessage("Invalid status value"),

  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required when rejecting an issue")
    .isLength({ max: 500 })
    .withMessage("Rejection reason cannot exceed 500 characters"),

  body("resolutionCost")
    .optional({ values: "undefined" })
    .custom((value) => {
      if (value === "") {
        return true;
      }

      if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0;
      }

      if (typeof value !== "string") {
        return false;
      }

      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return false;
      }

      const parsedValue = Number(trimmedValue);
      return Number.isFinite(parsedValue) && parsedValue >= 0;
    })
    .withMessage("Resolution cost must be a non-negative number"),
];

// ─── AI endpoint validators
export const aiSuggestValidator = [
  body("title")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title too long"),

  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description too long for AI analysis"),
];

export const aiTitleValidator = [
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),

  body("category")
    .optional({ checkFalsy: true })
    .isIn(VALID_CATEGORIES)
    .withMessage("Invalid category"),
];

export const aiDuplicateValidator = [
  body("category")
    .notEmpty()
    .withMessage("Category is required for duplicate detection")
    .isIn(VALID_CATEGORIES)
    .withMessage("Invalid category"),

  body("title").optional({ checkFalsy: true }).trim().isLength({ max: 200 }),

  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }),

  body("lat")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("lng")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];

// ───  Field worker validators
const FIELD_DEPARTMENTS = [
  "Road Maintenance",
  "Water Supply",
  "Sanitation",
  "Electrical",
  "Parks & Public Spaces",
  "General",
];

export const createFieldWorkerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isIn(FIELD_DEPARTMENTS)
    .withMessage(`Department must be one of: ${FIELD_DEPARTMENTS.join(", ")}`),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required")
    .isIn(VALID_PROVINCES)
    .withMessage("Invalid province"),

  body("district")
    .trim()
    .notEmpty()
    .withMessage("District is required")
    .custom(validateDistrictForProvince),
];

export const assignIssueValidator = [
  body("fieldWorkerId")
    .notEmpty()
    .withMessage("A field worker must be selected")
    .isMongoId()
    .withMessage("Invalid field worker ID"),
];

export const fieldStatusUpdateValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["in-progress", "resolved", "rejected"])
    .withMessage("Invalid status value"),

  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .trim()
    .notEmpty()
    .withMessage("Please explain why this issue cannot be resolved")
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),

  body("cost")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Resolution cost must be a non-negative number"),
];

// ──  password reset validators
export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),
];

export const createAdminValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),

  body("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required")
    .isIn(VALID_PROVINCES)
    .withMessage("Invalid province"),

  body("district")
    .optional({ checkFalsy: true })
    .trim()
    .custom(validateDistrictForProvince),
];

export const updateAdminJurisdictionValidator = [
  body("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required")
    .isIn(VALID_PROVINCES)
    .withMessage("Invalid province"),

  body("district")
    .optional({ checkFalsy: true })
    .trim()
    .custom(validateDistrictForProvince),
];

export const createCommentValidator = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),
];

export const twoFactorCodeValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 10 })
    .withMessage("Invalid verification code format"),
];

export const twoFactorLoginValidator = [
  body("pendingToken").notEmpty().withMessage("Missing login session"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 10 })
    .withMessage("Invalid verification code format"),
];

export const disableTwoFactorValidator = [
  body("password").notEmpty().withMessage("Password is required"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 10 })
    .withMessage("Invalid verification code format"),
];
