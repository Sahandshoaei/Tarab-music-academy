import { describe, expect, it } from "vitest";
import { calcAge } from "./age";

describe("calcAge — 4.4", () => {
  it("سن را درست حساب می‌کند", () => {
    const birth = new Date(Date.UTC(2000, 0, 1)); // 2000-01-01
    const now = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01 → 26 ساله
    expect(calcAge(birth, now)).toBe("۲۶");
  });

  it("قبل از تولد امسال یک سال کم می‌کند", () => {
    const birth = new Date(Date.UTC(2000, 5, 15)); // 2000-06-15
    const now = new Date(Date.UTC(2026, 0, 1)); // هنوز تولد نشده → 25
    expect(calcAge(birth, now)).toBe("۲۵");
  });

  it("روز تولد امسال دقیق", () => {
    const birth = new Date(Date.UTC(2000, 5, 15));
    const now = new Date(Date.UTC(2026, 5, 15)); // دقیق 26
    expect(calcAge(birth, now)).toBe("۲۶");
  });

  it("null → null", () => {
    expect(calcAge(null)).toBeNull();
  });

  it("ارقام فارسی برمی‌گرداند", () => {
    const birth = new Date(Date.UTC(2010, 0, 1));
    const now = new Date(Date.UTC(2026, 0, 1));
    expect(calcAge(birth, now)).toBe("۱۶");
  });
});
