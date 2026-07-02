const IssueCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    {/* Image area placeholder */}
    <div className="h-40 bg-gray-100" />

    <div className="p-4 space-y-3">
      {/* Badge row */}
      <div className="flex gap-2">
        <div className="h-5 w-24 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-gray-100 rounded" />
        <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-5/6 bg-gray-100 rounded" />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-3 w-12 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

export default IssueCardSkeleton;
