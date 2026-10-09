import type { ReactNode } from "react";

interface AuthSubmitProps {
  loading?: boolean;
  children: ReactNode;
}

/** Tombol kirim form untuk halaman auth (lebar penuh, aksen koral Wedding Planner). */
export function AuthSubmit({ loading = false, children }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-lanila-coral-deep text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(214,51,77,0.55)] transition-colors hover:bg-[#bf2a42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lanila-indigo disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : null}
      {children}
    </button>
  );
}
