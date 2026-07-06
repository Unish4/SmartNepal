import {
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  Building2,
  Trees,
  AlertCircle,
} from "lucide-react";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
} from "../../constants/issue.js";

const CATEGORY_ICONS_MAP = {
  "Road Damage": AlertTriangle,
  Garbage: Trash2,
  "Water Issue": Droplets,
  "Street Light": Lightbulb,
  "Illegal Construction": Building2,
  "Public Space": Trees,
  Other: AlertCircle,
};

// StatusBadge — small pill with coloured dot
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

// PriorityBadge — pulsing dot for critical priority
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
  const Icon = CATEGORY_ICONS_MAP[category] || AlertCircle;
  const c = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
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

// AIBadge — violet sparkle pill
export const AIBadge = ({ confidence }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs
    font-semibold bg-violet-50 text-violet-700 border border-violet-100"
  >
    ✦ AI · {confidence}%
  </span>
);
