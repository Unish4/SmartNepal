import { describe, it, expect } from "vitest";
import {
  lonToTileX,
  latToTileY,
  tileUrl,
  buildTileList,
} from "../src/lib/tileUtils.js";

describe("Slippy map tile math", () => {
  it("computes a tile X index within the valid range for a given zoom level", () => {
    const x = lonToTileX(85.324, 12);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(2 ** 12);
  });

  it("computes a tile Y index within the valid range for a given zoom level", () => {
    const y = latToTileY(27.7172, 12);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(2 ** 12);
  });

  it("produces a proportionally larger tile index at a higher zoom level for the same point", () => {
    const xLow = lonToTileX(85.324, 10);
    const xHigh = lonToTileX(85.324, 14);
    expect(xHigh).toBeGreaterThan(xLow);
  });

  it("picks the subdomain using the exact same formula Leaflet's default GridLayer uses", () => {
    // Math.abs(4 + 5) % 3 === 0 → subdomains[0] === 'a'
    expect(tileUrl(10, 4, 5)).toBe(
      "https://a.tile.openstreetmap.org/10/4/5.png",
    );
    // Math.abs(4 + 6) % 3 === 1 → subdomains[1] === 'b'
    expect(tileUrl(10, 4, 6)).toBe(
      "https://b.tile.openstreetmap.org/10/4/6.png",
    );
    // Math.abs(4 + 7) % 3 === 2 → subdomains[2] === 'c'
    expect(tileUrl(10, 4, 7)).toBe(
      "https://c.tile.openstreetmap.org/10/4/7.png",
    );
  });

  it("builds a tile list covering the full bounding box at every requested zoom level", () => {
    const bbox = { minLat: 27.7, maxLat: 27.72, minLng: 85.3, maxLng: 85.33 };
    const tiles = buildTileList(bbox, [14]);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((url) => url.includes("/14/"))).toBe(true);
  });

  it("never produces duplicate tile URLs within the same zoom level", () => {
    const bbox = { minLat: 27.7, maxLat: 27.72, minLng: 85.3, maxLng: 85.33 };
    const tiles = buildTileList(bbox, [14]);
    expect(new Set(tiles).size).toBe(tiles.length);
  });
});
