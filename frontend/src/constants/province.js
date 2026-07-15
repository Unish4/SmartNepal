import { NEPAL_LOCATIONS } from "./nepalLocations.js";

// Dynamically generated from the source of truth (nepalLocations.js)
// so both RegisterPage and admin-management pages share the same
// real province -> district data instead of duplicating it or using mocks.
export const PROVINCES = Object.keys(NEPAL_LOCATIONS).reduce((acc, province) => {
  acc[province] = Object.keys(NEPAL_LOCATIONS[province]).sort();
  return acc;
}, {});

