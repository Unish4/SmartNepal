import { MapContainer, TileLayer, Marker } from "react-leaflet";

const MiniMap = ({
  lat,
  lng,
  zoomControl = false,
  dragging = false,
  scrollWheelZoom = false,
  doubleClickZoom = false,
  touchZoom = false,
  keyboard = false,
}) => {
  if (!lat || !lng) return null;

  return (
    <div className="h-44 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={zoomControl}
        dragging={dragging}
        scrollWheelZoom={scrollWheelZoom}
        doubleClickZoom={doubleClickZoom}
        touchZoom={touchZoom}
        keyboard={keyboard}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
};

export default MiniMap;
