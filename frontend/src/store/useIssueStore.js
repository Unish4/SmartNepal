import { create } from "zustand";
import {
  fetchIssues,
  fetchIssueById,
  fetchMyIssues,
  createIssueRequest,
  updateIssueRequest,
  deleteIssueRequest,
  upvoteIssueRequest,
} from "../services/issueService.js";

// Helper: applies a new upvoterIds array to a single issue object.
// Used by the optimistic update and rollback paths below.
const patchUpvotes = (issue, id, newUpvoterIds) =>
  issue._id === id ? { ...issue, upvoterIds: newUpvoterIds } : issue;

const useIssueStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  issues: [],
  myIssues: [],
  currentIssue: null,
  pagination: null,
  myIssuesPagination: null,
  isLoading: false,
  error: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

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

  getMyIssues: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchMyIssues(params);
      set({ myIssues: res.issues, myIssuesPagination: res.pagination });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to load your issues",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createIssue: async (issueData) => {
    set({ isLoading: true });
    try {
      const res = await createIssueRequest(issueData);
      set((state) => ({ issues: [res.issue, ...state.issues] }));
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  updateIssue: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await updateIssueRequest(id, data);
      set((state) => ({
        issues: state.issues.map((i) => (i._id === id ? res.issue : i)),
        myIssues: state.myIssues.map((i) => (i._id === id ? res.issue : i)),
        currentIssue:
          state.currentIssue?._id === id ? res.issue : state.currentIssue,
      }));
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteIssue: async (id) => {
    set({ isLoading: true });
    try {
      await deleteIssueRequest(id);
      set((state) => ({
        issues: state.issues.filter((i) => i._id !== id),
        myIssues: state.myIssues.filter((i) => i._id !== id),
        currentIssue:
          state.currentIssue?._id === id ? null : state.currentIssue,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── upvoteIssue — optimistic update ────────────────────────────────────
  // Strategy:
  //   1. Snapshot the current upvoterIds so we can roll back on failure.
  //   2. Apply the toggled state to the store immediately (no loading spinner,
  //      no waiting — the UI reacts instantly).
  //   3. Fire the API call in the background.
  //   4. On success: replace the optimistic array with the authoritative one
  //      from the server (handles edge cases like concurrent votes).
  //   5. On failure: roll back to the snapshot and re-throw so the component
  //      can show an error toast.
  upvoteIssue: async (issueId, currentUserId) => {
    // Find the issue in whichever list has it.
    const state = get();
    const existing =
      state.issues.find((i) => i._id === issueId) ||
      state.myIssues.find((i) => i._id === issueId) ||
      (state.currentIssue?._id === issueId ? state.currentIssue : null);

    if (!existing) return;

    // Snapshot the original upvoterIds for rollback.
    const originalUpvoterIds = existing.upvoterIds ?? [];

    // Normalise IDs to strings — the array might contain ObjectId objects
    // (from non-.lean() responses) or plain strings.
    const idStr = (id) => (typeof id === "string" ? id : id?.toString());

    const alreadyUpvoted = originalUpvoterIds.some(
      (id) => idStr(id) === currentUserId,
    );

    // Build the optimistic version of upvoterIds.
    const optimisticUpvoterIds = alreadyUpvoted
      ? originalUpvoterIds.filter((id) => idStr(id) !== currentUserId)
      : [...originalUpvoterIds, currentUserId];

    // Apply optimistic update across every list simultaneously.
    set((s) => ({
      issues: s.issues.map((i) =>
        patchUpvotes(i, issueId, optimisticUpvoterIds),
      ),
      myIssues: s.myIssues.map((i) =>
        patchUpvotes(i, issueId, optimisticUpvoterIds),
      ),
      currentIssue: s.currentIssue
        ? patchUpvotes(s.currentIssue, issueId, optimisticUpvoterIds)
        : null,
    }));

    try {
      const res = await upvoteIssueRequest(issueId);

      // Replace optimistic data with the server's authoritative response.
      set((s) => ({
        issues: s.issues.map((i) => patchUpvotes(i, issueId, res.upvoterIds)),
        myIssues: s.myIssues.map((i) =>
          patchUpvotes(i, issueId, res.upvoterIds),
        ),
        currentIssue: s.currentIssue
          ? patchUpvotes(s.currentIssue, issueId, res.upvoterIds)
          : null,
      }));
    } catch (error) {
      // Rollback: restore the snapshot before the optimistic update.
      set((s) => ({
        issues: s.issues.map((i) =>
          patchUpvotes(i, issueId, originalUpvoterIds),
        ),
        myIssues: s.myIssues.map((i) =>
          patchUpvotes(i, issueId, originalUpvoterIds),
        ),
        currentIssue: s.currentIssue
          ? patchUpvotes(s.currentIssue, issueId, originalUpvoterIds)
          : null,
      }));
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useIssueStore;
