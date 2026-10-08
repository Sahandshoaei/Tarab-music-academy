import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { schoolSettings: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import { mapKavenegarStatus } from "./sms-provider";

describe("mapKavenegarStatus", () => {
  it.each([
    [1, "PENDING"],
    [2, "PENDING"],
    [4, "SENT"],
    [5, "SENT"],
    [6, "FAILED"],
    [10, "DELIVERED"],
    [11, "FAILED"],
    [13, "FAILED"],
    [14, "FAILED"],
    [100, "FAILED"],
  ] as const)("maps provider status %s to %s", (providerStatus, expected) => {
    expect(mapKavenegarStatus(providerStatus)).toBe(expected);
  });

  it("does not call an unknown status delivered", () => {
    expect(mapKavenegarStatus(999)).toBe("PENDING");
    expect(mapKavenegarStatus(undefined)).toBe("PENDING");
  });
});
