import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmit } from "@/components/auth/AuthSubmit";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const { signUp, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Sesi muncul (konfirmasi email nonaktif, atau sudah login) → arahkan ke beranda.
  useEffect(() => {
    if (!authLoading && session) navigate("/", { replace: true });
  }, [authLoading, session, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setInfo("");

    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Isi nama lengkap kamu.";
    if (!email.trim()) errors.email = "Isi email kamu.";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Format email belum benar.";
    if (!password) errors.password = "Buat kata sandi.";
    else if (password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setFormError(error);
        return;
      }
      // Jika konfirmasi email aktif, belum ada sesi: tetap di halaman ini dan beri petunjuk.
      // Jika nonaktif, sesi akan muncul dan useEffect di atas mengarahkan ke beranda.
      setInfo(
        "Akun sudah dibuat. Cek email kamu untuk konfirmasi, lalu masuk. Akun ini juga bisa dipakai di Lanila Buku Kas."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Buat akun"
      description={
        <>
          Satu akun untuk <strong>Wedding Planner</strong> dan <strong>Buku Kas</strong>.
        </>
      }
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-lanila-coral-deep underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          label="Nama lengkap"
          icon={User}
          autoComplete="name"
          placeholder="Nama kamu"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <AuthField
          label="Kata sandi"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />

        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-danger-bg px-3.5 py-3 text-sm text-[#962F27]"
          >
            <AlertCircle size={18} className="mt-px shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        ) : null}

        {info ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl bg-success-bg px-3.5 py-3 text-sm text-[#2F6B47]"
          >
            <CheckCircle2 size={18} className="mt-px shrink-0" aria-hidden="true" />
            <span>{info}</span>
          </div>
        ) : null}

        <AuthSubmit loading={loading}>{loading ? "Mendaftar…" : "Daftar"}</AuthSubmit>
      </form>
    </AuthShell>
  );
}
