import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <p className="text-sm font-semibold text-blush-600">404</p>
      <h1 className="text-2xl font-semibold text-ink">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        Alamat yang kamu buka tidak ada atau sudah dipindahkan.
      </p>
      <Link to="/" className="mt-2 text-sm font-medium text-blush-600 hover:underline">
        Kembali ke beranda
      </Link>
    </div>
  );
}
