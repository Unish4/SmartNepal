export const computeBoundingBox = (geometry) => {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  const walk = (coords) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords; 
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    } else {
      coords.forEach(walk);
    }
  };

  walk(geometry.coordinates);
  return { minLat, maxLat, minLng, maxLng };
};
