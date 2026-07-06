const IssueCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
    <div className="h-45 bg-[#f1f5f9] animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded bg-[#f1f5f9] animate-pulse" />
        <div className="h-5 w-14 rounded bg-[#f1f5f9] animate-pulse" />
      </div>
      <div className="h-4 w-full rounded bg-[#f1f5f9] animate-pulse" />
      <div className="h-4 w-4/5 rounded bg-[#f1f5f9] animate-pulse" />
      <div className="h-3 w-3/5 rounded bg-[#f1f5f9] animate-pulse" />
      <div className="flex justify-between items-center pt-2 border-t border-[#f1f5f9]">
        <div className="flex gap-2 items-center">
          <div className="w-7 h-7 rounded-full bg-[#f1f5f9] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[#f1f5f9] animate-pulse" />
        </div>
        <div className="h-3 w-12 rounded bg-[#f1f5f9] animate-pulse" />
      </div>
    </div>
  </div>
);

export default IssueCardSkeleton;
