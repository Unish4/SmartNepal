import { describe, it, expect, vi } from "vitest";

describe("Search pipeline stage selection", () => {
  it("falls back to a regex $match when Atlas Search is not enabled", async () => {
    vi.resetModules();
    vi.doMock("../src/config/env.js", () => ({
      default: { ATLAS_SEARCH_ENABLED: false, ATLAS_SEARCH_INDEX: null },
    }));
    const { buildSearchPipelineStages } =
      await import("../src/services/searchService.js");

    const stages = buildSearchPipelineStages("pothole", { status: "open" });
    expect(stages).toHaveLength(1);
    expect(stages[0].$match.$or).toBeDefined();
    expect(stages[0].$match.status).toBe("open");
  });

  it("escapes literal regex characters in the fallback search term", async () => {
    vi.resetModules();
    vi.doMock("../src/config/env.js", () => ({
      default: { ATLAS_SEARCH_ENABLED: false, ATLAS_SEARCH_INDEX: null },
    }));
    const { buildSearchPipelineStages } =
      await import("../src/services/searchService.js");

    const stages = buildSearchPipelineStages("pothole.*", { status: "open" });
    expect(stages[0].$match.$or).toEqual([
      { title: { $regex: "pothole\\.\\*", $options: "i" } },
      { description: { $regex: "pothole\\.\\*", $options: "i" } },
    ]);
  });

  it("builds a $search-first pipeline when Atlas Search is enabled", async () => {
    vi.resetModules();
    vi.doMock("../src/config/env.js", () => ({
      default: {
        ATLAS_SEARCH_ENABLED: true,
        ATLAS_SEARCH_INDEX: "issues_search",
      },
    }));
    const { buildSearchPipelineStages } =
      await import("../src/services/searchService.js");

    const stages = buildSearchPipelineStages("pothole", { status: "open" });
    expect(stages).toHaveLength(2);
    expect(stages[0].$search.index).toBe("issues_search");
    expect(stages[1].$match).toEqual({ status: "open" });
  });

  it("skips the search stage entirely when no search term is given, even with Atlas Search enabled", async () => {
    vi.resetModules();
    vi.doMock("../src/config/env.js", () => ({
      default: {
        ATLAS_SEARCH_ENABLED: true,
        ATLAS_SEARCH_INDEX: "issues_search",
      },
    }));
    const { buildSearchPipelineStages } =
      await import("../src/services/searchService.js");

    const stages = buildSearchPipelineStages("", { status: "open" });
    expect(stages).toHaveLength(1);
    expect(stages[0].$match).toEqual({ status: "open" });
  });
});
