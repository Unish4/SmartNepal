import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Real env vars are never used in tests — these are throwaway
    // values that satisfy config/env.js's required-vars check without
    // ever touching real Cloudinary, Gemini, or Atlas credentials.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test_jwt_secret_do_not_use_in_prod",
      CLIENT_URL: "http://localhost:5173",
      CLOUDINARY_CLOUD_NAME: "test",
      CLOUDINARY_API_KEY: "test",
      CLOUDINARY_API_SECRET: "test",
      GEMINI_API_KEY: "test",
      MONGODB_URI: "mongodb://localhost/unused", 
      PORT: "3001",
    },
    setupFiles: ["./tests/setup.js"],
    testTimeout: 20000, // mongodb-memory-server's first boot can be slow
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["tests/**", "src/scripts/**"],
    },
  },
});
