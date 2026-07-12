import Boundary from "../models/Boundary.js";

// detectBoundary — core GIS function.

export const detectBoundary = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  // Basic sanity check for Nepal's bounding box.
  // If the coordinates are wildly out of range we skip the DB query.
  if (
    isNaN(parsedLat) ||
    isNaN(parsedLng) ||
    parsedLat < 26.0 ||
    parsedLat > 30.5 ||
    parsedLng < 79.5 ||
    parsedLng > 88.3
  ) {
    return null;
  }

  // GeoJSON point — coordinates are [longitude, latitude] order.
  // This is the opposite of the GPS (lat, lng) convention and is a
  // very common source of bugs. Keep this comment here as a reminder.
  const point = {
    type: "Point",
    coordinates: [parsedLng, parsedLat],
  };

  const geoQuery = {
    geometry: {
      $geoIntersects: {
        $geometry: point,
      },
    },
  };

  try {
    // Run province and district queries in parallel — both read from the
    // same index so there's no benefit to sequential queries.
    const [province, district] = await Promise.all([
      Boundary.findOne({ ...geoQuery, type: "province" }).lean(),
      Boundary.findOne({ ...geoQuery, type: "district" }).lean(),
    ]);

    if (!province && !district) return null;

    return {
      province: province?.name ?? null,
      district: district?.name ?? null,
      parentProvince: district?.parentName ?? province?.name ?? null,
    };
  } catch (error) {
    // If the 2dsphere index doesn't exist yet (e.g. boundaries not seeded),
    // log a helpful message and reject so callers can preserve current values.
    console.error(
      `GIS boundary detection failed: ${error.message}\n` +
        `Have you run: npm run seed:boundaries ?`,
    );
    throw error;
  }
};

// parseNominatimAddress — secondary fallback.
// Nominatim's reverse geocode response includes structured address fields.
// When MongoDB boundary detection fails or boundaries aren't seeded,
// we can still extract province/district from the Nominatim API call
// that already happens in LocationPicker.jsx.
export const parseNominatimAddress = (address) => {
  if (!address) return {};

  // Nominatim uses different field names depending on the location type.
  // "state" is usually the province. "county" or "district" is the district.
  // "city" or "town" is the municipality.
  return {
    province: address.state || null,
    district: address.county || address.district || null,
    municipality: address.city || address.town || address.village || null,
    ward: address.suburb || null,
  };
};
