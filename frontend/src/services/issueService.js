import api from "../lib/axios.js";

// GET /api/issues — params object maps to ?page=1&limit=12 etc.
export const fetchIssues = async (params = {}) => {
  const response = await api.get("/api/issues", { params });
  return response.data;
};

// GET /api/issues/:id
export const fetchIssueById = async (id) => {
  const response = await api.get(`/api/issues/${id}`);
  return response.data;
};

// POST /api/issues — requires auth cookie (sent automatically by Axios)
export const createIssueRequest = async (issueData) => {
  const response = await api.post("/api/issues", issueData);
  return response.data;
};
