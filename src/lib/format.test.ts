import { describe, expect, it } from "vitest";
import { formatBytes, formatDuration, formatPercent, relativeAge } from "./format";

describe("formatBytes", () => {
  it("uses binary units and three significant digits", () => {
    expect(formatBytes(118 * 1024 ** 3)).toBe("118 GB");
    expect(formatBytes(5.12 * 1024 ** 3)).toBe("5.12 GB");
    expect(formatBytes(33.7 * 1024 ** 2)).toBe("33.7 MB");
  });
});
describe("display helpers", () => {
  it("handles percentage, duration, and relative age boundaries", () => {
    expect(formatPercent(0.09)).toBe("<0.1%");
    expect(formatDuration(5500)).toBe("5.5s");
    expect(relativeAge(1000, 1000 + 3 * 86400)).toBe("3 days ago");
  });
});
