import api from "../lib/axios.js";

// Fetch paginated issue list.
// params maps to query string: { page: 1, limit: 12 } → ?page=1&limit=12
export const fetchIssues = async (params = {}) => {
  const response = await api.get("/api/issues", { params });
  return response.data;
};

// Fetch single issue by MongoDB _id.
export const fetchIssueById = async (id) => {
  const response = await api.get(`/api/issues/${id}`);
  return response.data;
};

export const createIssueRequest = async (issueData) => {
  const formData = new FormData();

  formData.append("title",       issueData.title);
  formData.append("description", issueData.description);
  formData.append("category",    issueData.category);
  formData.append("priority",    issueData.priority || "low");

  if (issueData.address) {
    formData.append("address", issueData.address);
  }

  if (issueData.images?.length > 0) {
    issueData.images.forEach((file) => {
      formData.append("images", file);
    });
  }

  const response = await api.post("/api/issues", formData);
  return response.data;
};