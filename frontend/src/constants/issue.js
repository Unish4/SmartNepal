import {
  Construction,
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

export const CATEGORY_ICONS = {
  "Road Damage": Construction,
  "Garbage": Trash2,
  "Water Issue": Droplets,
  "Street Light": Lightbulb,
  "Illegal Construction": Building2,
  "Public Space": Trees,
  "Other": AlertCircle,
};

export const STATUS_CONFIG = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  verified: {
    label: "Verified",
    className: "bg-purple-50 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-400",
  },
};

// Priority badge styles.
export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-600",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700",
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-700",
  },
};
