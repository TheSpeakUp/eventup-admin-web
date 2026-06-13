import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * One label+input pattern with a consistent focus ring. Replaces the
 * `rounded border px-2 py-1` (no focus state) inputs scattered across the
 * forms. The lavender ring matches the InviteForm reference.
 */

const FIELD =
  "mt-1 w-full rounded-md border border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:border-primary-focus focus:outline-none focus:ring-1 focus:ring-primary-focus disabled:opacity-50";

export function FormField({
  label,
  hint,
  htmlFor,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </label>
  );
}

export function Input({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"input">) {
  return <input className={`${FIELD} ${className}`} {...rest} />;
}

export function Select({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"select">) {
  return <select className={`${FIELD} ${className}`} {...rest} />;
}

export function Textarea({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={`${FIELD} ${className}`} {...rest} />;
}
