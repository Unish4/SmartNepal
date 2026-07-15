import { describe, it, expect } from "vitest";
import {
  computeSlaDeadline,
  SLA_HOURS_BY_PRIORITY,
} from "../src/utils/slaConfig.js";

describe("SLA deadline computation", () => {
  it("gives a critical, non-urgent-category issue the standard critical window", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const deadline = computeSlaDeadline("critical", "Garbage", created);
    const hoursDiff = (deadline - created) / (60 * 60 * 1000);
    expect(hoursDiff).toBe(SLA_HOURS_BY_PRIORITY.critical);
  });

  it("halves the deadline for a critical Water Issue report", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const deadline = computeSlaDeadline("critical", "Water Issue", created);
    const hoursDiff = (deadline - created) / (60 * 60 * 1000);
    expect(hoursDiff).toBe(SLA_HOURS_BY_PRIORITY.critical / 2);
  });

  it("does not shorten a LOW-priority Water Issue report", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const deadline = computeSlaDeadline("low", "Water Issue", created);
    const hoursDiff = (deadline - created) / (60 * 60 * 1000);
    expect(hoursDiff).toBe(SLA_HOURS_BY_PRIORITY.low);
  });

  it("falls back to the low-priority window for an unrecognised priority value", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const deadline = computeSlaDeadline("unknown", "Garbage", created);
    const hoursDiff = (deadline - created) / (60 * 60 * 1000);
    expect(hoursDiff).toBe(SLA_HOURS_BY_PRIORITY.low);
  });
});
