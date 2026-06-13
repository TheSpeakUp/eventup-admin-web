import type { ReactNode } from "react";

/**
 * Standard page title row: title + optional description on the left, an
 * action slot (buttons / links) pinned right. Replaces the ad-hoc
 * `<header>` / `<div>` title rows. Keep the page-level `p-8` padding on the
 * page wrapper — this component only owns the header band.
 */
export default function PageHeader({
  title,
  description,
  actions,
  className = "",
  titleProps,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleProps?: React.HTMLAttributes<HTMLHeadingElement>;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h1
          {...titleProps}
          className={`text-2xl font-semibold tracking-tight text-ink ${titleProps?.className ?? ""}`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-subtle">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
