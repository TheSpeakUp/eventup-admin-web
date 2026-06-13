import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// One label+control pattern with a consistent lavender focus ring. Replaces the
// per-form drift (some inputs ring, some border-change, some no focus state).

const CONTROL =
  "w-full rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-tertiary focus:border-primary-focus focus:outline-none focus:ring-1 focus:ring-primary-focus disabled:opacity-50 read-only:opacity-70";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <span className="text-xs text-ink-tertiary">{hint}</span>
      ) : null}
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${CONTROL} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL} ${className}`} {...props} />;
}
