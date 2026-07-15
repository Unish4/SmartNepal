import api from "../lib/axios.js";

export const fetchDashboardStats = async () => {
  const response = await api.get("/api/admin/stats");
  return response.data;
};

export const fetchAllIssues = async (params = {}) => {
  const response = await api.get("/api/admin/issues", { params });
  return response.data;
};

// PATCH — changes status only; admins never edit title/description here.
export const updateIssueStatusRequest = async (id, data) => {
  const response = await api.patch(`/api/admin/issues/${id}/status`, data);
  return response.data;
};

export const fetchAllUsers = async (params = {}) => {
  const response = await api.get("/api/admin/users", { params });
  return response.data;
};

export const createFieldWorkerRequest = async (data) => {
  const response = await api.post("/api/admin/field-workers", data);
  return response.data;
};

// department is optional — omit to get the full crew list
export const fetchFieldWorkers = async (department) => {
  const response = await api.get("/api/admin/field-workers", {
    params: department ? { department } : {},
  });
  return response.data;
};

export const assignIssueRequest = async (issueId, fieldWorkerId) => {
  const response = await api.patch(`/api/admin/issues/${issueId}/assign`, {
    fieldWorkerId,
  });
  return response.data;
};

// ── admin account management (super_admin only) 
export const createAdminRequest = async (data) => {
  const response = await api.post("/api/admin/admins", data);
  return response.data;
};

export const fetchAdmins = async () => {
  const response = await api.get("/api/admin/admins");
  return response.data;
};

export const updateAdminJurisdictionRequest = async (adminId, jurisdiction) => {
  const response = await api.patch(
    `/api/admin/admins/${adminId}/jurisdiction`,
    jurisdiction,
  );
  return response.data;
};
