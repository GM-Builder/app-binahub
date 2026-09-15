import { describe, expect, it } from "vitest";
import { formatCountdown } from "./live-score-format";

describe("T-BOS Live Score screen", () => {
  it("formats a countdown shorter than one hour", () => {
    expect(formatCountdown(65)).toBe("01:05");
  });

  it("includes hours when the session is longer", () => {
    expect(formatCountdown(3_661)).toBe("01:01:01");
  });

  it("never displays a negative countdown", () => {
    expect(formatCountdown(-10)).toBe("00:00");
  });
});
