export const lonToTileX = (lon, zoom) =>
  Math.floor(((lon + 180) / 360) * 2 ** zoom);

export const latToTileY = (lat, zoom) => {
  const radLat = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(radLat) + 1 / Math.cos(radLat)) / Math.PI) / 2) *
      2 ** zoom,
  );
};

const SUBDOMAINS = ["a", "b", "c"];
export const tileUrl = (z, x, y) => {
  const subdomain = SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length];
  return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
};

export const buildTileList = (bbox, zoomLevels) => {
  const tiles = [];
  for (const z of zoomLevels) {
    const xMin = lonToTileX(bbox.minLng, z);
    const xMax = lonToTileX(bbox.maxLng, z);

    const yMin = latToTileY(bbox.maxLat, z);
    const yMax = latToTileY(bbox.minLat, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push(tileUrl(z, x, y));
      }
    }
  }
  return tiles;
};

export const ZOOM_LEVELS = [12, 13, 14, 15];
