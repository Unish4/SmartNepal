import ENV from "../config/env.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isAtlasSearchEnabled = () => ENV.ATLAS_SEARCH_ENABLED === true;

export const buildSearchPipelineStages = (searchTerm, otherFilters) => {
  const trimmed = searchTerm?.trim();

  if (trimmed && isAtlasSearchEnabled()) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    const wildcardStages = [];
    words.forEach((word) => {
      wildcardStages.push(
        {
          wildcard: {
            query: word.toLowerCase() + "*",
            path: "title",
            score: { boost: { value: 2 } },
            allowAnalyzedField: true,
          },
        },
        {
          wildcard: {
            query: word.toLowerCase() + "*",
            path: "description",
            allowAnalyzedField: true,
          },
        }
      );
    });

    const searchStage = {
      $search: {
        compound: {
          should: [
            {
              text: {
                query: trimmed,
                path: "title",
                score: { boost: { value: 3 } },
              },
            },
            { text: { query: trimmed, path: "description" } },
            ...wildcardStages,
          ],
          minimumShouldMatch: 1,
        },
      },
    };

    if (ENV.ATLAS_SEARCH_INDEX && ENV.ATLAS_SEARCH_INDEX !== "default") {
      searchStage.$search.index = ENV.ATLAS_SEARCH_INDEX;
    }

    return [searchStage, { $match: otherFilters }];
  }

  const match = { ...otherFilters };
  if (trimmed) {
    const escapedSearch = escapeRegex(trimmed);
    match.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }
  return [{ $match: match }];
};
