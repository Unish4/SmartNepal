import api from "../lib/axios.js";

// GET /api/field/assignments — issues assigned to the logged-in field worker
export const fetchMyAssignments = async (params = {}) => {
  const response = await api.get("/api/field/assignments", { params });
  return response.data;
};

// GET /api/field/stats — dashboard counts
export const fetchFieldStats = async () => {
  const response = await api.get("/api/field/stats");
  return response.data;
};


export const updateAssignmentStatusRequest = async (id, data) => {
  const formData = new FormData();
  formData.append("status", data.status);

  if (data.rejectionReason) {
    formData.append("rejectionReason", data.rejectionReason);
  }

  if (data.proofFiles?.length > 0) {
    data.proofFiles.forEach((file) => formData.append("proof", file));
  }

  const response = await api.patch(
    `/api/field/assignments/${id}/status`,
    formData,
  );
  return response.data;
};
