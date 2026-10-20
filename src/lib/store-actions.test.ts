import { describe, expect, it } from "vitest";
import { createWorkspace, recordBudgetPayment, updateGuestRsvp, updatePreparationStatus, updateSeserahanStatus, updateTaskStatus, updateVendorStatus } from "./store-actions";
import { emptyUserData, type UserData } from "./user-storage";

const U = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ctx = { actorName: "Akun Uji", now: new Date("2026-10-12T03:00:00Z") };

function base(): UserData {
  const d = createWorkspace(emptyUserData(), U, { name: "Proyek Uji", weddingDate: "2027-05-01T00:00:00.000Z", targetBudget: 5000, weddingType: "Akad & Resepsi" });
  const w = d.workspace!.id;
  return {
    ...d,
    vendors: [{ id: "v1", workspaceId: w, name: "Vendor Uji", category: "Catering", price: 100, dpAmount: 0, status: "research" }],
    budgetItems: [{ id: "b1", workspaceId: w, category: "Catering", name: "Paket Uji", plannedAmount: 1000, actualAmount: 1000, paidAmount: 250, paymentStatus: "dp" }],
    tasks: [{ id: "t1", workspaceId: w, title: "Tugas Uji", category: "Vendor", deadline: "2027-01-10", priority: "high", status: "todo" }],
    guests: [{ id: "g1", workspaceId: w, name: "Tamu Uji", category: "Family", pax: 2, rsvp: "belum" }],
    seserahan: [{ id: "s1", workspaceId: w, name: "Item Uji", category: "Fashion", plannedBudget: 10, actualCost: 0, status: "belum" }],
  } as UserData;
}

describe("createWorkspace", () => {
  it("memberi pemilik = akun, id baru, dan daftar persiapan netral (semua 'belum')", () => {
    const d = base();
    expect(d.workspace?.ownerId).toBe(U);
    expect(d.workspace?.id.startsWith("wk_")).toBe(true);
    const items = d.stages.flatMap((s) => s.items);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.status === "belum")).toBe(true);
    expect(d.stages.every((s) => s.workspaceId === d.workspace?.id)).toBe(true);
  });

  it("tidak menimpa proyek yang sudah ada", () => {
    const d = base();
    const again = createWorkspace(d, U, { name: "Lain", targetBudget: 1, weddingType: "x" });
    expect(again).toBe(d);
    expect(again.workspace?.name).toBe("Proyek Uji");
  });

  it("menolak nama kosong atau akun kosong", () => {
    const e = emptyUserData();
    expect(createWorkspace(e, U, { name: "   ", targetBudget: 0, weddingType: "x" })).toBe(e);
    expect(createWorkspace(e, "", { name: "Ada", targetBudget: 0, weddingType: "x" })).toBe(e);
  });
});

describe("pembaruan data", () => {
  it("status persiapan tercatat di aktivitas dengan nama akun aktif", () => {
    const d = updatePreparationStatus(base(), "st_rtrw", "i1", "selesai", ctx);
    expect(d.stages[0].items[0].status).toBe("selesai");
    expect(d.activityLog[0].actorName).toBe("Akun Uji");
    expect(d.activityLog[0].action).toBe("menyelesaikan");
  });

  it("id tidak dikenal tidak mengubah apa pun dan tidak membuat aktivitas palsu", () => {
    const d = base();
    expect(updatePreparationStatus(d, "x", "y", "selesai", ctx)).toBe(d);
    expect(updateTaskStatus(d, "nope", "completed", ctx)).toBe(d);
    expect(updateVendorStatus(d, "nope", "booked", ctx)).toBe(d);
    expect(updateGuestRsvp(d, "nope", "hadir", ctx)).toBe(d);
    expect(updateSeserahanStatus(d, "nope", "dibeli", ctx)).toBe(d);
    expect(recordBudgetPayment(d, "nope", 5, ctx)).toBe(d);
  });

  it("pembayaran: DP lalu lunas, tidak melebihi biaya aktual", () => {
    let d = recordBudgetPayment(base(), "b1", 250, ctx);
    expect([d.budgetItems[0].paidAmount, d.budgetItems[0].paymentStatus]).toEqual([500, "dp"]);
    d = recordBudgetPayment(d, "b1", 900, ctx);
    expect([d.budgetItems[0].paidAmount, d.budgetItems[0].paymentStatus]).toEqual([1000, "lunas"]);
  });

  it("pembayaran dengan angka tidak valid ditolak", () => {
    const d = base();
    expect(recordBudgetPayment(d, "b1", Number.NaN, ctx)).toBe(d);
  });

  it("aktivitas dibatasi 50 entri terbaru", () => {
    let d = base();
    for (let i = 0; i < 70; i++) d = updateGuestRsvp(d, "g1", i % 2 ? "hadir" : "belum", ctx);
    expect(d.activityLog).toHaveLength(50);
  });
});
