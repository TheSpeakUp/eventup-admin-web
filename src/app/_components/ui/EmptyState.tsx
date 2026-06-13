import type { ReactNode } from "react";

// One boxed empty-state pattern. Replaces the mix of dashed-border cards and
// bare <p class="text-gray-500"> paragraphs (gray-* isn't dark-inverted; only
// zinc-* is) across the list pages.
export default function EmptyState({
  children,
  testid,
  className = "",
}: {
  children: ReactNode;
  testid?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testid}
      className={`rounded-lg border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle ${className}`}
    >
      {children}
    </div>
  );
}
