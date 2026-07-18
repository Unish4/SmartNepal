import { buildTileList, ZOOM_LEVELS } from "./tileUtils.js";

const TILE_CACHE_NAME = "nepalsewa-map-tiles";
const MAX_CONCURRENT_DOWNLOADS = 6;

export const estimateDownload = (bbox) => {
  const tiles = buildTileList(bbox, ZOOM_LEVELS);
  const estimatedMB = ((tiles.length * 15) / 1024).toFixed(1);
  return { tileCount: tiles.length, estimatedMB, tiles };
};

export const downloadTiles = async (tiles, onProgress) => {
  const cache = await caches.open(TILE_CACHE_NAME);
  let completed = 0,
    failed = 0;

  const worker = async (queue) => {
    while (queue.length > 0) {
      const url = queue.pop();
      try {
        const response = await fetch(url, { mode: "no-cors" });
        await cache.put(url, response);
      } catch {
        failed++;
      } finally {
        completed++;
        onProgress?.({ completed, failed, total: tiles.length });
      }
    }
  };

  const queue = [...tiles];
  await Promise.all(
    Array.from({ length: MAX_CONCURRENT_DOWNLOADS }, () => worker(queue)),
  );

  return { completed, failed, total: tiles.length };
};

export const clearOfflineTiles = async () => {
  await caches.delete(TILE_CACHE_NAME);
};
