import api from "../lib/axios.js";

export const fetchOfflineMapBounds = async () => {
  const response = await api.get("/api/issues/offline-map-bounds");
  return response.data;
};
