import { create } from "zustand";
import {
  fetchIssues,
  fetchIssueById,
  createIssueRequest,
} from "../services/issueService.js";

const useIssueStore = create((set) => ({
  issues: [],
  currentIssue: null,
  pagination: null,
  isLoading: false,
  error: null,


  // Fetches the paginated issue list. Called on IssuesPage mount.
  getIssues: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchIssues(params);
      set({ issues: res.issues, pagination: res.pagination });
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to load issues" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches a single issue for the detail page.
  getIssueById: async (id) => {
    set({ isLoading: true, currentIssue: null, error: null });
    try {
      const res = await fetchIssueById(id);
      set({ currentIssue: res.issue });
    } catch (error) {
      set({ error: error.response?.data?.message || "Issue not found" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new issue and prepends it to the list.
  createIssue: async (issueData) => {
    set({ isLoading: true });
    try {
      const res = await createIssueRequest(issueData);
      // Prepend to list so it appears at the top without a full refetch.
      set((state) => ({
        issues: [res.issue, ...state.issues],
      }));
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  // Clears any error from a previous failed request.
  clearError: () => set({ error: null }),
}));

export default useIssueStore;
