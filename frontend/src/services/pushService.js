import api from "../lib/axios.js";

export const fetchVapidPublicKey = async () => {
  const response = await api.get("/api/push/vapid-public-key");
  return response.data;
};

export const subscribePushRequest = async (subscription) => {
  const response = await api.post("/api/push/subscribe", subscription);
  return response.data;
};

export const unsubscribePushRequest = async (endpoint) => {
  const response = await api.post("/api/push/unsubscribe", { endpoint });
  return response.data;
};
