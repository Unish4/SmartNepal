import {
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Building2,
  Trees,
  AlertCircle,
} from "lucide-react";

export const CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Water Issue",
  "Street Light",
  "Illegal Construction",
  "Public Space",
  "Other",
];

// Matches Figma's CATEGORY_CFG exactly — icon, colour, background
export const CATEGORY_ICONS = {
  "Road Damage": AlertTriangle,
  Garbage: Trash2,
  "Water Issue": Droplets,
  "Street Light": Lightbulb,
  "Illegal Construction": Building2,
  "Public Space": Trees,
  Other: AlertCircle,
};

export const CATEGORY_CONFIG = {
  "Road Damage": { color: "#64748b", bg: "#f1f5f9" },
  Garbage: { color: "#65a30d", bg: "#f7fee7" },
  "Water Issue": { color: "#0284c7", bg: "#f0f9ff" },
  "Street Light": { color: "#ca8a04", bg: "#fefce8" },
  "Illegal Construction": { color: "#ea580c", bg: "#fff7ed" },
  "Public Space": { color: "#16a34a", bg: "#f0fdf4" },
  Other: { color: "#94a3b8", bg: "#f8fafc" },
};

// Figma STATUS_CFG with exact hex values
export const STATUS_CONFIG = {
  open: { label: "Open", dot: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  verified: {
    label: "Verified",
    dot: "#8b5cf6",
    bg: "#f5f3ff",
    text: "#6d28d9",
  },
  "in-progress": {
    label: "In Progress",
    dot: "#f59e0b",
    bg: "#fffbeb",
    text: "#b45309",
  },
  resolved: {
    label: "Resolved",
    dot: "#22c55e",
    bg: "#f0fdf4",
    text: "#15803d",
  },
  rejected: {
    label: "Rejected",
    dot: "#ef4444",
    bg: "#fef2f2",
    text: "#b91c1c",
  },
};

// Figma PRIORITY_CFG with pulse for critical
export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#64748b", bg: "#f1f5f9", pulse: false },
  medium: { label: "Medium", color: "#b45309", bg: "#fffbeb", pulse: false },
  high: { label: "High", color: "#ea580c", bg: "#fff7ed", pulse: false },
  critical: { label: "Critical", color: "#dc2626", bg: "#fef2f2", pulse: true },
};

//  Role & department config 
export const ROLE_CONFIG = {
  citizen: {
    label: "Citizen",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  admin: {
    label: "Administrator",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  field_worker: {
    label: "Field Worker",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
};

export const FIELD_DEPARTMENTS = [
  "Road Maintenance",
  "Water Supply",
  "Sanitation",
  "Electrical",
  "Parks & Public Spaces",
  "General",
];
