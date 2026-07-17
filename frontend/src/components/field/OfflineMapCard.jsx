import {
  Download,
  Trash2,
  MapPinned,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useOfflineMapDownload } from "../../hooks/useOfflineMapDownload.js";

const OfflineMapCard = () => {
  const {
    estimate,
    isEstimating,
    prepareEstimate,
    progress,
    isDownloading,
    startDownload,
    savedMeta,
    clearDownload,
    error,
  } = useOfflineMapDownload();

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <MapPinned size={15} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-[#0f172a]">Offline Maps</h2>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {savedMeta && !isDownloading && (
        <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 mb-3">
          <CheckCircle2
            size={14}
            className="text-[#16a34a] shrink-0 mt-0.5"
          />
          <div>
            <p className="text-xs font-semibold text-[#16a34a]">
              {savedMeta.tileCount.toLocaleString()} tiles cached for{" "}
              {savedMeta.label}
            </p>
            <p className="text-[10px] text-[#94a3b8] mt-0.5">
              Downloaded{" "}
              {new Date(savedMeta.downloadedAt).toLocaleDateString("en-NP")}
            </p>
          </div>
        </div>
      )}

      {!savedMeta && !estimate && !isDownloading && (
        <>
          <p className="text-xs text-[#64748b] mb-3 leading-relaxed">
            Pre-download map tiles for your assigned district so navigation
            still works with no signal in the field.
          </p>
          <button
            onClick={prepareEstimate}
            disabled={isEstimating}
            className="w-full h-10 rounded-lg border border-amber-200 text-amber-700 text-xs
              font-semibold hover:bg-amber-50 transition-colors disabled:opacity-50
              flex items-center justify-center gap-2"
          >
            {isEstimating ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Checking your
                jurisdiction…
              </>
            ) : (
              "Check download size"
            )}
          </button>
        </>
      )}

      {!savedMeta && estimate && !isDownloading && (
        <div>
          <div className="bg-[#f8fafc] rounded-lg px-3 py-2.5 mb-3">
            <p className="text-xs text-[#0f172a]">
              <span className="font-semibold">{estimate.label}</span> —{" "}
              {estimate.tileCount.toLocaleString()} tiles (~
              {estimate.estimatedMB} MB)
            </p>
            {estimate.tileCount > 4000 && (
              <p className="flex items-center gap-1.5 text-[10px] text-amber-600 mt-1.5">
                <AlertTriangle size={10} /> Large area — this may take several
                minutes and use significant mobile data.
              </p>
            )}
          </div>
          <button
            onClick={startDownload}
            className="w-full h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white
              text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download size={13} /> Download{" "}
            {estimate.tileCount.toLocaleString()} tiles
          </button>
        </div>
      )}

      {isDownloading && progress && (
        <div>
          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-amber-500 transition-all duration-200"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-[#64748b] text-center">
            {progress.completed.toLocaleString()} /{" "}
            {progress.total.toLocaleString()} tiles
            {progress.failed > 0 && ` · ${progress.failed} failed`}
          </p>
        </div>
      )}

      {savedMeta && !isDownloading && (
        <button
          onClick={clearDownload}
          className="w-full h-9 mt-3 rounded-lg border border-red-200 text-red-600 text-xs
            font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 size={12} /> Clear cached maps
        </button>
      )}
    </div>
  );
};

export default OfflineMapCard;
