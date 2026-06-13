import type { ReactNode } from "react";

// Consistent page title row: title (+ optional description) on the left, an
// optional action slot (button, link) on the right. Replaces the ad-hoc
// <header>/<div> title rows with differing spacing across pages.
export default function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-subtle">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {meta ? <span className="text-sm text-ink-subtle">{meta}</span> : null}
        {actions}
      </div>
    </div>
  );
}
