import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Navigation, MapPin, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useOfflineStore from "../../store/useOfflineStore.js";

const NEPAL_CENTER = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

const MapCenterer = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position)
      map.setView([position.lat, position.lng], 15, { animate: true });
  }, [position, map]);
  return null;
};

const LocationPicker = ({ onLocationChange, initialPosition = null }) => {
  const { isOnline } = useOfflineStore();
  const [hasOfflineMap, setHasOfflineMap] = useState(
    () => !!localStorage.getItem("smartnepal-offline-map-meta")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setHasOfflineMap(!!localStorage.getItem("smartnepal-offline-map-meta"));
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("offline-map-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("offline-map-change", handleStorageChange);
    };
  }, []);

  const [position, setPosition] = useState(initialPosition);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      return data.display_name || "Pinned coordinates";
    } catch {
      return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)} (Offline Pinned)`;
    }
  };

  const handleMapClick = async (lat, lng) => {
    setPosition({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    onLocationChange({ lat, lng, address });
    localStorage.setItem(
      "nepalsewa-last-location",
      JSON.stringify({ lat, lng, address }),
    );
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
        localStorage.setItem(
          "nepalsewa-last-location",
          JSON.stringify({ lat, lng, address }),
        );
        setIsLocating(false);
        toast.success("Location detected!");
      },
      () => {
        const cached = localStorage.getItem("nepalsewa-last-location");
        if (cached) {
          try {
            const { lat, lng, address } = JSON.parse(cached);
            if (typeof lat !== "number" || typeof lng !== "number") {
              throw new Error("Invalid cached location");
            }
            setPosition({ lat, lng });
            onLocationChange({ lat, lng, address });
            toast.success(
              "Could not detect location. Restored last pinned location.",
            );
          } catch {
            toast.error("Could not get your location. Click the map instead.");
          }
        } else {
          toast.error("Could not get your location. Click the map instead.");
        }
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        },
      );
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        toast.error("No locations found for your search query");
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
      toast.error("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    setPosition({ lat, lng });
    onLocationChange({ lat, lng, address });
    setSearchResults([]);
    setSearchQuery("");
    toast.success("Location pinned from search!");
  };

  const mapCenter = position ? [position.lat, position.lng] : NEPAL_CENTER;
  const mapZoom = position ? 15 : DEFAULT_ZOOM;

  return (
    <div className="space-y-3">
      {/* Typed Location Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type address or search location..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e2e8f0] text-sm
              placeholder:text-[#94a3b8] text-[#0f172a] outline-none
              focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all"
          />
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="h-10 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white
            font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-1.5"
        >
          {isSearching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </form>

      {/* Search results list */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-md max-h-48 overflow-y-auto z-10 relative">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => selectSearchResult(result)}
              className="w-full px-4 py-2.5 text-left text-xs hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-b-0
                text-[#475569] font-medium block truncate transition-colors cursor-pointer"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={useMyLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm
          font-medium border border-[#e2e8f0] rounded-xl text-[#475569]
          hover:bg-[#f8fafc] transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Navigation size={15} className="text-[#16a34a]" />
        {isLocating ? "Detecting your location..." : "Use my current location"}
      </button>

      <div className="relative h-72 rounded-xl overflow-hidden border border-[#e2e8f0]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onLocationSelect={handleMapClick} />
          <MapCenterer position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
        {!isOnline && (
          <div className="absolute top-2 left-12 right-2 z-1000 bg-slate-900/90 text-white text-[10px] sm:text-xs px-3 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 shadow-md">
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${hasOfflineMap ? "bg-[#16a34a]" : "bg-amber-400"}`} />
            <span>
              {hasOfflineMap
                ? "Using downloaded offline map. You can pan/zoom within your cached district."
                : "Map tiles are unavailable offline. You can download maps from your Profile page to use them offline."}
            </span>
          </div>
        )}
      </div>

      {position ? (
        <div
          className="flex items-start gap-2 bg-[#f0fdf4] border border-[#bbf7d0]
          rounded-xl px-3 py-2.5"
        >
          <MapPin size={14} className="text-[#16a34a] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#16a34a]">
              Location pinned
            </p>
            <p className="text-xs text-[#16a34a]/85 mt-0.5">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#94a3b8] text-center">
          Click anywhere on the map to pin the issue location
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
