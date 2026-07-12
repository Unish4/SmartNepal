// Run with: npm run seed:boundaries
//
// Loads official Nepal province and district boundary polygons into MongoDB.
// Reads the GeoJSON files from backend/gis folder and parses features to database models.
//

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Boundary from "../models/Boundary.js";
import ENV from "../config/env.js";

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GIS_DIR = path.join(__dirname, "../../gis");

const admin1Path = path.join(GIS_DIR, "npl_admin1.geojson");
const admin2Path = path.join(GIS_DIR, "npl_admin2.geojson");

// Mapping functions to align names and codes with frontend constants
const mapProvinceName = (adm1_name) => {
  const name = adm1_name.trim();
  if (name === "Sudur Paschim") return "Sudurpashchim Province";
  if (!name.endsWith("Province")) return `${name} Province`;
  return name;
};

const mapProvinceCode = (adm1_pcode) => {
  const digits = adm1_pcode.replace("NP", "");
  return "P" + parseInt(digits, 10);
};

const mapDistrictCode = (adm2_pcode) => {
  const digits = adm2_pcode.substring(4);
  return "D" + digits;
};

const seed = async () => {
  try {
    // 1. Verify GeoJSON files exist
    if (!fs.existsSync(admin1Path)) {
      throw new Error(`Province boundaries file not found at ${admin1Path}`);
    }
    if (!fs.existsSync(admin2Path)) {
      throw new Error(`District boundaries file not found at ${admin2Path}`);
    }

    console.log("✓ Found boundary GeoJSON files");

    // 2. Parse GeoJSON files
    console.log("→ Loading and parsing province boundaries...");
    const admin1 = JSON.parse(fs.readFileSync(admin1Path, "utf8"));
    const PROVINCES = admin1.features.map((f) => ({
      name: mapProvinceName(f.properties.adm1_name),
      type: "province",
      code: mapProvinceCode(f.properties.adm1_pcode),
      geometry: f.geometry,
    }));

    console.log("→ Loading and parsing district boundaries...");
    const admin2 = JSON.parse(fs.readFileSync(admin2Path, "utf8"));
    const DISTRICTS = admin2.features.map((f) => ({
      name: f.properties.adm2_name.trim(),
      type: "district",
      code: mapDistrictCode(f.properties.adm2_pcode),
      parentName: mapProvinceName(f.properties.adm1_name),
      geometry: f.geometry,
    }));

    // 3. Connect to database
    console.log("→ Connecting to MongoDB...");
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // 4. Drop existing boundaries (idempotent seed run)
    const deletedCount = await Boundary.deleteMany({});
    console.log(
      `✓ Cleared ${deletedCount.deletedCount} existing boundary documents`,
    );

    // 5. Seed provinces and districts
    const provinces = await Boundary.insertMany(PROVINCES);
    console.log(`✓ Seeded ${provinces.length} provinces`);

    const districts = await Boundary.insertMany(DISTRICTS);
    console.log(`✓ Seeded ${districts.length} districts`);

    console.log("\n── Summary ──────────────────────────────────────────");
    console.log(`  Total boundaries: ${provinces.length + districts.length}`);
    console.log(`  Provinces:        ${provinces.length}`);
    console.log(`  Districts:        ${districts.length}`);
    console.log("\n✓ Seed complete");

    process.exit(0);
  } catch (error) {
    console.error("✗ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
