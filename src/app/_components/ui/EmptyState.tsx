import type { ComponentPropsWithoutRef } from "react";

/**
 * Boxed dashed "nothing here yet" placeholder. Replaces the bare
 * `<p class="text-gray-500">` empties (gray is NOT inverted by the dark theme)
 * and the inconsistent zinc/padding one-offs.
 */
export default function EmptyState({
  className = "",
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`rounded-md border border-dashed border-hairline-strong p-10 text-center text-sm text-ink-subtle ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
