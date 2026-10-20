import type { StorageLike } from "@/lib/user-storage";

export interface MemoryStorage extends StorageLike {
  /** salinan seluruh isi (untuk pengecekan di tes) */
  dump(): Record<string, string>;
  /** jumlah panggilan setItem (untuk menguji "tidak menulis jika isinya sama") */
  readonly writes: number;
}

/** Storage di memori yang meniru bentuk window.localStorage (termasuk length dan key()). */
export function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const map = new Map<string, string>(Object.entries(initial));
  let writes = 0;
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => {
      writes++;
      map.set(k, v);
    },
    removeItem: (k) => void map.delete(k),
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    dump: () => Object.fromEntries(map),
    get writes() {
      return writes;
    },
  };
}
