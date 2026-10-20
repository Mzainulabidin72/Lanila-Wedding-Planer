import { describe, expect, it } from "vitest";
import { budgetTotals, formatDate, getCountdown, guestTotals, overallPreparationProgress, daysUntil, upcomingTasks } from "./derive";
import { getDisplayName } from "./display-name";

describe("data kosong tidak menghasilkan NaN", () => {
  it("tanggal kosong / tidak valid", () => {
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("bukan-tanggal")).toBe("-");
    expect(daysUntil("bukan-tanggal")).toBeNull();
    const c = getCountdown(undefined);
    expect(c.isSet).toBe(false);
    expect([c.days, c.hours, c.minutes, c.seconds]).toEqual([0, 0, 0, 0]);
    expect(getCountdown("2999-01-01T00:00:00Z").isSet).toBe(true);
  });

  it("progres, budget, tamu, dan tugas kosong", () => {
    expect(overallPreparationProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
    expect(budgetTotals([])).toEqual({ planned: 0, actual: 0, paid: 0, remaining: 0, utilization: 0 });
    expect(guestTotals([])).toEqual({ total: 0, confirmed: 0, pending: 0, declined: 0 });
    expect(upcomingTasks([], 5)).toEqual([]);
  });
});

describe("getDisplayName", () => {
  it("urutan: profil, metadata pendaftaran, email; tidak pernah nama contoh", () => {
    expect(getDisplayName({ full_name: "  Budi Santoso " }, { email: "b@x.id" })).toBe("Budi Santoso");
    expect(getDisplayName(null, { email: "b@x.id", user_metadata: { full_name: "Siti Aminah" } })).toBe("Siti Aminah");
    expect(getDisplayName(null, { email: "dewi.k@x.id", user_metadata: {} })).toBe("dewi.k");
    expect(getDisplayName(null, null)).toBe("Pengguna");
  });
});
