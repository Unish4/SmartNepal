import api from "../lib/axios.js";

export const fetchComments = async (issueId) => {
  const response = await api.get(`/api/issues/${issueId}/comments`);
  return response.data;
};

export const createCommentRequest = async (issueId, text) => {
  const response = await api.post(`/api/issues/${issueId}/comments`, { text });
  return response.data;
};

export const deleteCommentRequest = async (issueId, commentId) => {
  const response = await api.delete(
    `/api/issues/${issueId}/comments/${commentId}`,
  );
  return response.data;
};
