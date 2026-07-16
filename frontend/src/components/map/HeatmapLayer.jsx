import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points || points.length === 0) return;

    const size = map.getSize();
    if (size.x === 0 || size.y === 0) {
      map.invalidateSize();
      const newSize = map.getSize();
      if (newSize.x === 0 || newSize.y === 0) {
        return;
      }
    }

    const heatPoints = points.map((p) => [p.lat, p.lng, p.weight]);

    layerRef.current = L.heatLayer(heatPoints, {
      radius: 22,
      blur: 18,
      maxZoom: 14,
      gradient: {
        0.2: "#86efac",
        0.4: "#16a34a",
        0.6: "#f59e0b",
        0.8: "#ea580c",
        1.0: "#dc2626",
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
