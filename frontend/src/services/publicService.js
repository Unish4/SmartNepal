import api from "../lib/axios.js";

export const fetchScorecard = async (province, district) => {
  const path = district
    ? `/api/public/scorecard/${encodeURIComponent(province)}/${encodeURIComponent(district)}`
    : `/api/public/scorecard/${encodeURIComponent(province)}`;
  const response = await api.get(path);
  return response.data;
};

export const fetchScorecardDirectory = async () => {
  const response = await api.get("/api/public/scorecard-directory");
  return response.data;
};
