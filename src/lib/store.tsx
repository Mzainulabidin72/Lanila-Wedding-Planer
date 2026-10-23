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
import * as legacy from "./legacy-data";
import {
  emptyUserData,
  getBrowserStorage,
  isOwnStorageEvent,
  loadUserData,
  saveUserData,
  StorageLike,
  UserData,
} from "./user-storage";
import type { GuestErrors, RawGuestInput } from "./guests";
import type { Guest, RsvpStatus, WeddingWorkspace } from "./types";

type StoreData = Omit<UserData, "version">;

/**
 * Hasil operasi tamu. ok:true HANYA jika data benar-benar sudah tersimpan di penyimpanan.
 * error "storage" = gagal menyimpan (penyimpanan penuh/diblokir); data TIDAK berubah.
 */
export type GuestResult =
  | { ok: true; guest: Guest }
  | { ok: false; error: actions.GuestActionError; errors?: GuestErrors };

interface StoreContextValue extends StoreData {
  /** Membuat proyek pernikahan milik akun ini. Mengembalikan proyek (atau yang sudah ada). */
  createWorkspace: (input: actions.NewWorkspaceInput) => WeddingWorkspace | null;
  updatePreparationStatus: (stageId: string, itemId: string, status: Parameters<typeof actions.updatePreparationStatus>[3]) => void;
  updateTaskStatus: (taskId: string, status: Parameters<typeof actions.updateTaskStatus>[2]) => void;
  recordBudgetPayment: (budgetItemId: string, amount: number) => void;
  updateVendorStatus: (vendorId: string, status: Parameters<typeof actions.updateVendorStatus>[2]) => void;
  updateGuestRsvp: (guestId: string, rsvp: Parameters<typeof actions.updateGuestRsvp>[2]) => void;
  updateSeserahanStatus: (itemId: string, status: Parameters<typeof actions.updateSeserahanStatus>[2]) => void;

  // --- daftar tamu: tulis dulu ke penyimpanan, baru ubah state; sukses hanya jika tersimpan ---
  addGuest: (raw: RawGuestInput) => GuestResult;
  updateGuest: (guestId: string, raw: RawGuestInput) => GuestResult;
  deleteGuest: (guestId: string) => GuestResult;
  setGuestRsvp: (guestId: string, rsvp: RsvpStatus) => GuestResult;

  // --- data LAMA dari versi sebelum data dipisah per akun (kepemilikan tidak terverifikasi) ---
  /** Data lama di browser ini yang boleh ditawarkan ke akun ini. Tidak dipakai kecuali pengguna memilih impor. */
  legacyEntries: legacy.LegacySummary[];
  /** Impor atas keputusan pengguna. Hanya jika akun ini belum punya proyek; tidak menimpa apa pun. */
  importLegacyData: (sourceKey: string) => legacy.ImportResult;
  /** Pengguna memilih tidak mengimpor: tawaran untuk isi yang sama tidak muncul lagi di akun ini. */
  dismissLegacyData: () => void;
  /** Isi file cadangan data lama untuk diunduh. */
  getLegacyBackup: () => legacy.BackupFile | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

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
  const store = storage === undefined ? getBrowserStorage() : storage;
  const [state, setState] = useState<UserData>(() => loadUserData(store, userId));
  const stateRef = useRef(state);
  const [legacyEntries, setLegacyEntries] = useState<legacy.LegacySummary[]>(() => legacy.scanLegacy(store, userId));

  useEffect(() => {
    saveUserData(store, userId, state);
  }, [store, userId, state]);

  // Cadangan data lama: hanya SALINAN ke arsip terisolasi, sumber tidak diubah/dihapus.
  // StoreProvider hanya terpasang saat ada sesi login yang valid.
  useEffect(() => {
    legacy.archiveLegacyData(store);
  }, [store]);

  // Tab lain mengubah data akun yang SAMA: muat ulang supaya tab ini tidak menimpanya dengan state basi.
  // (Perubahan akun di tab lain ditangani lewat sesi Supabase + key={user.id} di UserScopedStore.)
  useEffect(() => {
    if (typeof window === "undefined" || !store) return;
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== store || !isOwnStorageEvent(e.key, userId)) return;
      const next = loadUserData(store, userId);
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [store, userId]);

  // Semua perubahan lewat sini: dihitung dari state terbaru (anti lost-update / klik ganda).
  const commit = useCallback((fn: (current: UserData) => UserData) => {
    const next = fn(stateRef.current);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setState(next);
    }
    return next;
  }, []);

  // Operasi yang hasilnya dilaporkan ke pengguna: simpan DULU, ubah state HANYA jika penyimpanan berhasil.
  const run = useCallback(
    (compute: (current: UserData) => actions.GuestActionResult): GuestResult => {
      const result = compute(stateRef.current);
      if (!result.ok) return result;
      if (!saveUserData(store, userId, result.data)) return { ok: false, error: "storage" };
      stateRef.current = result.data;
      setState(result.data);
      return { ok: true, guest: result.guest };
    },
    [store, userId]
  );

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

      addGuest: (raw) => run((s) => actions.addGuest(s, raw, ctx())),
      updateGuest: (guestId, raw) => run((s) => actions.updateGuest(s, guestId, raw, ctx())),
      deleteGuest: (guestId) => run((s) => actions.deleteGuest(s, guestId, ctx())),
      setGuestRsvp: (guestId, rsvp) => run((s) => actions.setGuestRsvp(s, guestId, rsvp, ctx())),

      legacyEntries,
      importLegacyData: (sourceKey) => {
        const result = legacy.importLegacy(store, userId, sourceKey);
        if (result.ok) {
          const next = loadUserData(store, userId); // sinkronkan memori dengan hasil impor yang sudah diverifikasi
          stateRef.current = next;
          setState(next);
          setLegacyEntries([]);
        }
        return result;
      },
      dismissLegacyData: () => {
        legacy.dismissLegacy(store, userId);
        setLegacyEntries([]);
      },
      getLegacyBackup: () => legacy.buildBackupFile(store),
    };
  }, [state, userId, actorName, commit, run, store, legacyEntries]);

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
