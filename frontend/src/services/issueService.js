import api from "../lib/axios.js";

export const fetchIssues = async (params = {}) => {
  const response = await api.get("/api/issues", { params });
  return response.data;
};

export const fetchIssueById = async (id) => {
  const response = await api.get(`/api/issues/${id}`);
  return response.data;
};

export const createIssueRequest = async (issueData) => {
  const formData = new FormData();

  formData.append("title", issueData.title);
  formData.append("description", issueData.description);
  formData.append("category", issueData.category);
  formData.append("priority", issueData.priority || "low");

  if (issueData.address) formData.append("address", issueData.address);
  if (issueData.lat != null) formData.append("lat", String(issueData.lat));
  if (issueData.lng != null) formData.append("lng", String(issueData.lng));

  if (issueData.images?.length > 0) {
    issueData.images.forEach((file) => formData.append("images", file));
  }

  const response = await api.post("/api/issues", formData);
  return response.data;
};
