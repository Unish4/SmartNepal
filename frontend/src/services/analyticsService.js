import api from "../lib/axios.js";

export const fetchAnalytics = async (days = 30) => {
  const response = await api.get("/api/admin/analytics", { params: { days } });
  return response.data;
};
