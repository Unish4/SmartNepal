import arcjet, {
  shield,
  detectBot,
  slidingWindow,
  validateEmail,
} from "@arcjet/node";
import ENV from "./env.js";

const isConfigured = !!ENV.ARCJET_KEY && ENV.NODE_ENV === "production";

// Base client with Shield (for global middleware)
const baseClient = isConfigured
  ? arcjet({
      key: ENV.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [shield({ mode: "LIVE" })],
    })
  : null;

// Route base client without rules (to avoid duplicate protect() and double Shield checks)
const routeBase = isConfigured
  ? arcjet({
      key: ENV.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [],
    })
  : null;

export const registerArcjet = isConfigured
  ? routeBase
      .withRule(slidingWindow({ mode: "LIVE", interval: "15m", max: 5 }))
      .withRule(detectBot({ mode: "LIVE", allow: [] }))
      .withRule(
        validateEmail({
          mode: "LIVE",
          deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
        }),
      )
  : null;

export const loginArcjet = isConfigured
  ? routeBase
      .withRule(slidingWindow({ mode: "LIVE", interval: "15m", max: 10 }))
      .withRule(detectBot({ mode: "LIVE", allow: [] }))
  : null;

export const issueCreateArcjet = isConfigured
  ? routeBase
      .withRule(slidingWindow({ mode: "LIVE", interval: "1h", max: 20 }))
      .withRule(detectBot({ mode: "LIVE", allow: [] }))
  : null;

export const passwordResetArcjet = isConfigured
  ? baseClient.withRule(
      slidingWindow({ mode: "LIVE", interval: "15m", max: 5 }),
    )
  : null;

export const scorecardArcjet = isConfigured
  ? baseClient.withRule(
      slidingWindow({ mode: "LIVE", interval: "10m", max: 30 }),
    )
  : null;

export default baseClient;
