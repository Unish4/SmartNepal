import { useState, useCallback } from "react";
import { fetchOfflineMapBounds } from "../services/fieldMapService.js";
import {
  estimateDownload,
  downloadTiles,
  clearOfflineTiles,
} from "../lib/offlineMapCache.js";

const STORAGE_KEY = "nepalsewa-offline-map-meta";

export const useOfflineMapDownload = () => {
  const [estimate, setEstimate] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedMeta, setSavedMeta] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);

  const prepareEstimate = useCallback(async () => {
    setIsEstimating(true);
    setError(null);
    try {
      const res = await fetchOfflineMapBounds();
      const { tileCount, estimatedMB, tiles } = estimateDownload(res.bbox);
      setEstimate({ label: res.label, tileCount, estimatedMB, tiles });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not determine your jurisdiction's map area.",
      );
    } finally {
      setIsEstimating(false);
    }
  }, []);

  const startDownload = useCallback(async () => {
    if (!estimate) return;
    setIsDownloading(true);
    setProgress({ completed: 0, failed: 0, total: estimate.tileCount });
    try {
      const result = await downloadTiles(estimate.tiles, setProgress);
      const successful = result.completed - result.failed;
      if (successful === 0) {
        throw new Error("No map tiles could be downloaded.");
      }
      const meta = {
        label: estimate.label,
        tileCount: successful,
        downloadedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
      setSavedMeta(meta);
      window.dispatchEvent(new Event("offline-map-change"));
    } finally {
      setIsDownloading(false);
    }
  }, [estimate]);

  const clearDownload = useCallback(async () => {
    await clearOfflineTiles();
    localStorage.removeItem(STORAGE_KEY);
    setSavedMeta(null);
    setEstimate(null);
    setProgress(null);
    window.dispatchEvent(new Event("offline-map-change"));
  }, []);

  return {
    estimate,
    isEstimating,
    prepareEstimate,
    progress,
    isDownloading,
    startDownload,
    savedMeta,
    clearDownload,
    error,
  };
};
