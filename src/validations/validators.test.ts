import { describe, expect, it } from "vitest";
import {
  isValidMobile,
  isValidNationalId,
  normalizeMobile,
  toEnglishDigits,
} from "./validators";

describe("toEnglishDigits", () => {
  it("ارقام فارسی را تبدیل می‌کند", () => {
    expect(toEnglishDigits("۰۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
  });
  it("ارقام عربی را تبدیل می‌کند", () => {
    expect(toEnglishDigits("٠١٢٣")).toBe("0123");
  });
  it("بقیه کاراکترها دست‌نخورده می‌مانند", () => {
    expect(toEnglishDigits("abc-۱۲۳")).toBe("abc-123");
  });
});

describe("normalizeMobile / isValidMobile — F2-AC2", () => {
  it("فرمت ساده معتبر", () => {
    expect(isValidMobile("09121234567")).toBe(true);
  });
  it("ارقام فارسی + جداکننده نرمال می‌شود", () => {
    expect(isValidMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷")).toBe(true);
    expect(normalizeMobile("۰۹۱۲-۱۲۳-۴۵۶۷")).toBe("09121234567");
  });
  it("با +98 شروع می‌شود → بعد از نرمال‌سازی نامعتبر (۹۸+...) ", () => {
    // توجه: پذیرش +98 تصمیم UI است؛ اعتبارسنج پایه فقط 09... را می‌پذیرد
    expect(isValidMobile("+989121234567")).toBe(false);
  });
  it("کوتاه/بلند نامعتبر", () => {
    expect(isValidMobile("0912123456")).toBe(false);
    expect(isValidMobile("091212345678")).toBe(false);
    expect(isValidMobile("")).toBe(false);
  });
  it("پیش‌شماره نادرست", () => {
    expect(isValidMobile("00123456789")).toBe(false);
  });
});

describe("isValidNationalId — F2-AC3", () => {
  // کد نمونه معتبر: 0012345679
  //   sum = 0×10+0×9+1×8+2×7+3×6+4×5+5×4+6×3+7×2 = 112 → 112%11=2 → check=9 ✓
  it("کد معتبر (رقم کنترل درست)", () => {
    expect(isValidNationalId("0012345679")).toBe(true);
  });
  it("رقم کنترل غلط", () => {
    expect(isValidNationalId("0012345678")).toBe(false);
  });
  it("ارقام فارسی پذیرفته می‌شود", () => {
    expect(isValidNationalId("۰۰۱۲۳۴۵۶۷۹")).toBe(true);
  });
  it("کوتاه/غیررقمی نامعتبر", () => {
    expect(isValidNationalId("12345")).toBe(false);
    expect(isValidNationalId("abcdefghij")).toBe(false);
  });
  it("همه ارقام یکسان نامعتبر", () => {
    expect(isValidNationalId("1111111111")).toBe(false);
  });
});
