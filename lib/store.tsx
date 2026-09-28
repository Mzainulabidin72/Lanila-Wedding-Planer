"use client";

/**
 * Mock data layer.
 *
 * Every wedding-planner UI component reads/writes through this context, never
 * through mock-data.ts directly. That's intentional: when the real backend is
 * wired up, only this file needs to change (swap the reducer + effects below
 * for Supabase queries / mutations). Component code should not need to change.
 *
 * Persistence here is localStorage, scoped per workspace id, purely so the
 * prototype feels alive across reloads. It is NOT how the production app
 * should persist data — see /supabase/schema.sql for the real model.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as seed from "./mock-data";
import {
  BudgetItem,
  Guest,
  PreparationStage,
  SeserahanItem,
  Vendor,
  WeddingTask,
  WeddingWorkspace,
} from "./types";

interface StoreShape {
  workspace: WeddingWorkspace;
  stages: PreparationStage[];
  tasks: WeddingTask[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  guests: Guest[];
  seserahan: SeserahanItem[];
  activityLog: typeof seed.activityLog;
  members: typeof seed.members;
}

interface StoreContextValue extends StoreShape {
  updatePreparationStatus: (stageId: string, itemId: string, status: PreparationStage["items"][number]["status"]) => void;
  updateTaskStatus: (taskId: string, status: WeddingTask["status"]) => void;
  recordBudgetPayment: (budgetItemId: string, amount: number) => void;
  updateVendorStatus: (vendorId: string, status: Vendor["status"]) => void;
  updateGuestRsvp: (guestId: string, rsvp: Guest["rsvp"]) => void;
  updateSeserahanStatus: (itemId: string, status: SeserahanItem["status"]) => void;
}

const STORAGE_KEY = `lanila-wp:${seed.WORKSPACE_ID}`;

const StoreContext = createContext<StoreContextValue | null>(null);

function loadInitial(): StoreShape {
  if (typeof window === "undefined") {
    return {
      workspace: seed.workspace,
      stages: seed.preparationStages,
      tasks: seed.tasks,
      budgetItems: seed.budgetItems,
      vendors: seed.vendors,
      guests: seed.guests,
      seserahan: seed.seserahanItems,
      activityLog: seed.activityLog,
      members: seed.members,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed data
  }
  return {
    workspace: seed.workspace,
    stages: seed.preparationStages,
    tasks: seed.tasks,
    budgetItems: seed.budgetItems,
    vendors: seed.vendors,
    guests: seed.guests,
    seserahan: seed.seserahanItems,
    activityLog: seed.activityLog,
    members: seed.members,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreShape>(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors in the prototype
    }
  }, [state]);

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      updatePreparationStatus: (stageId, itemId, status) =>
        setState((s) => ({
          ...s,
          stages: s.stages.map((stage) =>
            stage.id !== stageId
              ? stage
              : { ...stage, items: stage.items.map((it) => (it.id === itemId ? { ...it, status } : it)) }
          ),
        })),
      updateTaskStatus: (taskId, status) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        })),
      recordBudgetPayment: (budgetItemId, amount) =>
        setState((s) => ({
          ...s,
          budgetItems: s.budgetItems.map((b) =>
            b.id !== budgetItemId
              ? b
              : {
                  ...b,
                  paidAmount: Math.min(b.actualAmount, b.paidAmount + amount),
                  paymentStatus:
                    b.paidAmount + amount >= b.actualAmount ? "lunas" : amount > 0 ? "dp" : b.paymentStatus,
                }
          ),
        })),
      updateVendorStatus: (vendorId, status) =>
        setState((s) => ({
          ...s,
          vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, status } : v)),
        })),
      updateGuestRsvp: (guestId, rsvp) =>
        setState((s) => ({
          ...s,
          guests: s.guests.map((g) => (g.id === guestId ? { ...g, rsvp } : g)),
        })),
      updateSeserahanStatus: (itemId, status) =>
        setState((s) => ({
          ...s,
          seserahan: s.seserahan.map((it) => (it.id === itemId ? { ...it, status } : it)),
        })),
    }),
    [state]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
