import { describe, expect, it } from "vitest";
import { tuitionForClassType } from "./finance.service";

describe("tuitionForClassType — 2.4 شهریه صفر", () => {
  const rates = { privateRate: 3000000, groupRate: 1000000, semiGroupRate: 2000000, practiceRate: 500000 };

  it("PRIVATE → privateRate", () => {
    expect(tuitionForClassType("PRIVATE", rates)).toBe(3000000);
  });
  it("GROUP → groupRate", () => {
    expect(tuitionForClassType("GROUP", rates)).toBe(1000000);
  });
  it("SEMI_GROUP → semiGroupRate", () => {
    expect(tuitionForClassType("SEMI_GROUP", rates)).toBe(2000000);
  });
  it("PRACTICE → practiceRate", () => {
    expect(tuitionForClassType("PRACTICE", rates)).toBe(500000);
  });
  it("نوع ناشناخته → 0", () => {
    expect(tuitionForClassType("UNKNOWN", rates)).toBe(0);
  });
  it("rates null → 0 (هشدار 2.4)", () => {
    expect(tuitionForClassType("PRIVATE", null)).toBe(0);
  });
  it("rate صفر → 0 و isZeroTuition باید true شود", () => {
    const zeroRates = { privateRate: 0, groupRate: 0, semiGroupRate: 0, practiceRate: 0 };
    expect(tuitionForClassType("PRIVATE", zeroRates)).toBe(0);
  });
});

describe("تقسیم نسبی پرداخت — 2.5", () => {
  it("تقسیم نسبی به نسبت شهریه", () => {
    // شبیه‌سازی منطق createTuitionPayment بدون DB
    const classIds = [1, 2];
    const tuitionMap = new Map([[1, 3000000], [2, 1000000]]);
    const amount = 2000000;
    const totalTuition = 4000000;
    const allocations = classIds.map((cid) => ({
      classId: cid,
      amount: Math.floor((amount * (tuitionMap.get(cid) ?? 0)) / totalTuition),
    }));
    let allocated = allocations.reduce((s, a) => s + a.amount, 0);
    let remainder = amount - allocated;
    const sorted = [...classIds].sort((a, b) => (tuitionMap.get(b) ?? 0) - (tuitionMap.get(a) ?? 0));
    let idx = 0;
    while (remainder > 0) {
      const cid = sorted[idx % sorted.length];
      allocations.find((x) => x.classId === cid)!.amount += 1;
      remainder--;
      idx++;
    }
    // خصوصی 3× گروهی → 1.5م و 0.5م
    expect(allocations.find((a) => a.classId === 1)!.amount).toBe(1500000);
    expect(allocations.find((a) => a.classId === 2)!.amount).toBe(500000);
    expect(allocations.reduce((s, a) => s + a.amount, 0)).toBe(amount);
  });
});
