import { InputHTMLAttributes, useId, useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  icon: LucideIcon;
  /** Pesan error untuk kolom ini. Jika ada, kolom ditandai merah. */
  error?: string;
  /** Petunjuk singkat di bawah kolom (disembunyikan saat ada error). */
  hint?: string;
}

export function AuthField({
  label,
  icon: Icon,
  error,
  hint,
  type = "text",
  className,
  ...rest
}: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-lanila-navy">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={clsx(
            "h-12 w-full rounded-xl border bg-white pl-11 text-base text-lanila-navy placeholder:text-slate-400",
            "transition-colors focus:outline-none focus:ring-4",
            isPassword ? "pr-12" : "pr-4",
            error
              ? "border-danger focus:border-danger focus:ring-danger/15"
              : "border-slate-300 hover:border-slate-400 focus:border-lanila-indigo focus:ring-lanila-indigo/15"
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-lanila-navy"
          >
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={messageId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
