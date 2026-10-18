/**
 * Data layer lokal, TERPISAH PER AKUN.
 *
 * Semua komponen membaca/menulis lewat context ini. Data dimuat dari penyimpanan
 * milik akun yang sedang login (lihat user-storage.ts) dan TIDAK PERNAH diisi data
 * contoh. Akun baru memulai dari kosong (workspace = null) lalu diarahkan ke onboarding.
 *
 * StoreProvider dipasang dengan key={userId} (lihat App.tsx), sehingga ganti akun atau
 * logout membuang seluruh state akun sebelumnya dari memori.
 *
 * Catatan: penyimpanan di sini masih localStorage (per browser). Saat backend
 * Supabase dipakai untuk data, hanya file ini dan store-actions.ts yang perlu diganti.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as actions from "./store-actions";
import { emptyUserData, loadUserData, saveUserData, StorageLike, UserData } from "./user-storage";
import type { WeddingWorkspace } from "./types";

type StoreData = Omit<UserData, "version">;

interface StoreContextValue extends StoreData {
  /** Membuat proyek pernikahan milik akun ini. Mengembalikan proyek (atau yang sudah ada). */
  createWorkspace: (input: actions.NewWorkspaceInput) => WeddingWorkspace | null;
  updatePreparationStatus: (stageId: string, itemId: string, status: Parameters<typeof actions.updatePreparationStatus>[3]) => void;
  updateTaskStatus: (taskId: string, status: Parameters<typeof actions.updateTaskStatus>[2]) => void;
  recordBudgetPayment: (budgetItemId: string, amount: number) => void;
  updateVendorStatus: (vendorId: string, status: Parameters<typeof actions.updateVendorStatus>[2]) => void;
  updateGuestRsvp: (guestId: string, rsvp: Parameters<typeof actions.updateGuestRsvp>[2]) => void;
  updateSeserahanStatus: (itemId: string, status: Parameters<typeof actions.updateSeserahanStatus>[2]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // akses storage diblokir browser
  }
}

interface StoreProviderProps {
  /** id akun yang sedang login (dari sesi terverifikasi), bukan input bebas. */
  userId: string;
  /** nama akun, dicatat sebagai pelaku di "Aktivitas Terbaru". */
  actorName: string;
  /** hanya untuk pengujian; default window.localStorage. */
  storage?: StorageLike | null;
  children: React.ReactNode;
}

export function StoreProvider({ userId, actorName, storage, children }: StoreProviderProps) {
  const store = storage === undefined ? defaultStorage() : storage;
  const [state, setState] = useState<UserData>(() => loadUserData(store, userId));
  const stateRef = useRef(state);

  useEffect(() => {
    saveUserData(store, userId, state);
  }, [store, userId, state]);

  // Semua perubahan lewat sini: dihitung dari state terbaru (anti lost-update / klik ganda).
  const commit = useCallback((fn: (current: UserData) => UserData) => {
    const next = fn(stateRef.current);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setState(next);
    }
    return next;
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const ctx = (): actions.ActionContext => ({ actorName });
    const { version: _version, ...data } = state;
    void _version;
    return {
      ...data,
      createWorkspace: (input) => commit((s) => actions.createWorkspace(s, userId, input)).workspace,
      updatePreparationStatus: (stageId, itemId, status) =>
        void commit((s) => actions.updatePreparationStatus(s, stageId, itemId, status, ctx())),
      updateTaskStatus: (taskId, status) => void commit((s) => actions.updateTaskStatus(s, taskId, status, ctx())),
      recordBudgetPayment: (budgetItemId, amount) =>
        void commit((s) => actions.recordBudgetPayment(s, budgetItemId, amount, ctx())),
      updateVendorStatus: (vendorId, status) => void commit((s) => actions.updateVendorStatus(s, vendorId, status, ctx())),
      updateGuestRsvp: (guestId, rsvp) => void commit((s) => actions.updateGuestRsvp(s, guestId, rsvp, ctx())),
      updateSeserahanStatus: (itemId, status) =>
        void commit((s) => actions.updateSeserahanStatus(s, itemId, status, ctx())),
    };
  }, [state, userId, actorName, commit]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/**
 * Proyek pernikahan milik akun ini. Hanya untuk halaman di dalam /w/:workspaceId,
 * di mana WorkspaceLayout sudah memastikan proyek ada dan milik akun yang login.
 */
export function useWorkspace(): WeddingWorkspace {
  const { workspace } = useStore();
  if (!workspace) throw new Error("useWorkspace dipakai sebelum proyek pernikahan dibuat");
  return workspace;
}

export { emptyUserData };
