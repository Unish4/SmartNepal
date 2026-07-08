// ── Base block
export const Skeleton = ({ className = "" }) => (
  <div
    className={`bg-[#f1f5f9] rounded animate-pulse ${className}`}
    aria-hidden="true"
  />
);

// ── Text line skeleton 
export const SkeletonLine = ({ className = "w-full h-4" }) => (
  <Skeleton className={className} />
);

// ── Avatar skeleton 
export const SkeletonAvatar = ({ size = "md" }) => {
  const sizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-16 h-16" };
  return <Skeleton className={`${sizes[size]} rounded-full shrink-0`} />;
};

// ── Card skeleton 
// Generic white card wrapper with inner shimmer content.
export const SkeletonCard = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-[#e2e8f0] shadow-sm
    overflow-hidden animate-pulse ${className}`}
    aria-hidden="true"
  >
    {children}
  </div>
);

// ── Issue card skeleton — matches IssueCard dimensions exactly ───────────
export const IssueCardSkeleton = () => (
  <SkeletonCard>
    <div className="h-45 bg-[#f1f5f9]" />
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
      <div className="flex justify-between items-center pt-2 border-t border-[#f1f5f9]">
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </SkeletonCard>
);

// ── Profile page skeleton 
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-4 animate-pulse" aria-hidden="true">
    {/* Header */}
    <Skeleton className="h-7 w-40" />

    {/* Avatar card */}
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 flex items-center gap-5">
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>

    {/* Info card */}
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f1f5f9]">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-3.5 border-b border-[#f8fafc] last:border-0"
        >
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      ))}
    </div>

    {/* Prefs card */}
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f1f5f9]">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="w-11 h-6 rounded-full shrink-0" />
      </div>
    </div>
  </div>
);

// ── Edit issue form skeleton 
export const EditIssueSkeleton = () => (
  <div className="max-w-2xl mx-auto animate-pulse space-y-5" aria-hidden="true">
    {/* Header */}
    <div className="flex items-center gap-3 mb-7">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <Skeleton className="h-7 w-36" />
    </div>

    {/* Title field */}
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>

    {/* Category + Priority grid */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>

    {/* Description */}
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>

    {/* Map placeholder */}
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>

    {/* Actions */}
    <div className="flex items-center gap-3">
      <Skeleton className="flex-1 h-11 rounded-xl" />
      <Skeleton className="w-24 h-11 rounded-xl" />
    </div>
  </div>
);

// ── Table row skeleton 
// Used in AdminIssuesPage and AdminUsersPage.
// colCount controls how many shimmer cells to render.
export const TableRowSkeleton = ({ colCount = 8 }) => (
  <tr className="animate-pulse" aria-hidden="true">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <Skeleton className="h-4 rounded" />
      </td>
    ))}
  </tr>
);

// ── Admin dashboard stat card skeleton 
export const StatCardSkeleton = () => (
  <SkeletonCard className="p-5">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
    </div>
    <Skeleton className="h-9 w-20" />
    <Skeleton className="h-3 w-36 mt-1" />
  </SkeletonCard>
);

// ── My issues list row skeleton 
export const IssueRowSkeleton = () => (
  <div
    className="bg-white border border-[#e2e8f0] rounded-xl p-4 animate-pulse"
    aria-hidden="true"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-8 w-12 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  </div>
);
