import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmit } from "@/components/auth/AuthSubmit";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function LoginPage() {
  const { signIn, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sudah login → arahkan ke beranda. Dilakukan di useEffect, bukan saat render.
  useEffect(() => {
    if (!authLoading && session) navigate("/", { replace: true });
  }, [authLoading, session, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Isi email kamu.";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Format email belum benar.";
    if (!password) errors.password = "Isi kata sandi kamu.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setFormError(error);
        return;
      }
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Masuk"
      description={
        <>
          Pakai akun Lanila kamu. Kalau sudah punya akun di <strong>Buku Kas</strong>, akun
          yang sama bisa langsung dipakai di sini.
        </>
      }
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="font-semibold text-lanila-coral-deep underline-offset-4 hover:underline"
          >
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
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
          autoComplete="current-password"
          placeholder="Kata sandi kamu"
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

        <AuthSubmit loading={loading}>{loading ? "Masuk…" : "Masuk"}</AuthSubmit>
      </form>
    </AuthShell>
  );
}
