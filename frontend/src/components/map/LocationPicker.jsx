import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Navigation, MapPin } from "lucide-react";
import toast from "react-hot-toast";

// Nepal's geographic center — the map opens here by default.
const NEPAL_CENTER = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapCenterer = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15, { animate: true });
    }
  }, [position, map]);
  return null;
};

const LocationPicker = ({ onLocationChange }) => {
  const [position, setPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      // display_name is the full comma-separated address string.
      return data.display_name || "";
    } catch {
      // Geocoding failure is non-critical — we still have the coordinates.
      return "";
    }
  };

  const handleMapClick = async (lat, lng) => {
    setPosition({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    onLocationChange({ lat, lng, address });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition({ lat, lng });
        const address = await reverseGeocode(lat, lng);
        onLocationChange({ lat, lng, address });
        setIsLocating(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not get your location. Click on the map instead.");
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      {/* Use my current location button */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm
          font-medium border border-gray-200 rounded-lg text-gray-600
          hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Navigation size={15} className="text-green-600" />
        {isLocating ? "Detecting your location..." : "Use my current location"}
      </button>

      {/* Interactive map — centered on Nepal */}
      <div className="h-72 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={NEPAL_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Listens for clicks and forwards coordinates */}
          <ClickHandler onLocationSelect={handleMapClick} />

          {/* Pans map when location is set via GPS button */}
          <MapCenterer position={position} />

          {/* Drop a marker at the selected position */}
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {/* Status line below the map */}
      {position ? (
        <div
          className="flex items-start gap-2 bg-green-50 border border-green-100
          rounded-lg px-3 py-2.5"
        >
          <MapPin size={14} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-700">
              Location pinned
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Click anywhere on the map to pin the issue location
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
