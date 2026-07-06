import {
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Building2,
  Trees,
  AlertCircle,
} from "lucide-react";

import { PRIORITY_CONFIG, STATUS_CONFIG } from "../../constants/issue.js";

// StatusBadge — inline dot + label
export const StatusBadge = ({ status, large = false }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium
        ${large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"}`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span
        className={`rounded-full shrink-0 ${large ? "w-2 h-2" : "w-1.5 h-1.5"}`}
        style={{ backgroundColor: c.dot }}
      />
      {c.label}
    </span>
  );
};

// PriorityBadge — with pulsing dot for critical
export const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.pulse ? (
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: c.color }}
          />
          <span
            className="relative inline-flex rounded-full w-1.5 h-1.5"
            style={{ backgroundColor: c.color }}
          />
        </span>
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: c.color }}
        />
      )}
      {c.label}
    </span>
  );
};

// CategoryBadge — icon + label
export const CategoryBadge = ({ category }) => {
  const icons = {
    "Road Damage": AlertTriangle,
    Garbage: Trash2,
    "Water Issue": Droplets,
    "Street Light": Lightbulb,
    "Illegal Construction": Building2,
    "Public Space": Trees,
    Other: AlertCircle,
  };

  const colors = {
    "Road Damage": { color: "#64748b", bg: "#f1f5f9" },
    Garbage: { color: "#65a30d", bg: "#f7fee7" },
    "Water Issue": { color: "#0284c7", bg: "#f0f9ff" },
    "Street Light": { color: "#ca8a04", bg: "#fefce8" },
    "Illegal Construction": { color: "#ea580c", bg: "#fff7ed" },
    "Public Space": { color: "#16a34a", bg: "#f0fdf4" },
    Other: { color: "#94a3b8", bg: "#f8fafc" },
  };

  const Icon = icons[category] || AlertCircle;
  const c = colors[category] || colors.Other;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Icon size={10} />
      {category}
    </span>
  );
};
