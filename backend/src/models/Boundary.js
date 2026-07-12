import mongoose from "mongoose";

const boundarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Bagmati Province" or "Kathmandu"
    },

    // Hierarchy level — drives which query to use in gisService.js
    type: {
      type: String,
      enum: ["province", "district"],
      required: true,
    },

    // For districts: which province they belong to.
    // Used to display "Kathmandu, Bagmati Province" without a join.
    parentName: {
      type: String,
      trim: true,
    },

    // Official Nepal administrative codes
    // Province: "P1"–"P7"   District: "D01"–"D77"
    code: {
      type: String,
      trim: true,
    },

    // GeoJSON geometry — Polygon or MultiPolygon.
    // The 2dsphere index is declared below on this path.
    // GeoJSON coordinate order is ALWAYS [longitude, latitude] — the
    // opposite of what most people expect from GPS (lat, lng).
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true,
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },
  },
  { timestamps: true },
);

// 2dsphere index — enables spherical geometry queries ($geoIntersects,
// $geoWithin, $near, $nearSphere) on the geometry field.
boundarySchema.index({ geometry: "2dsphere" });

// Compound index on type + name for fast lookups like
//   Boundary.findOne({ type: "province", name: "Bagmati Province" })
boundarySchema.index({ type: 1, name: 1 });

const Boundary = mongoose.model("Boundary", boundarySchema);
export default Boundary;
