import type { ReactNode } from "react";

// A bounded responsibility zone: a card with its own header (title + optional
// accent dot + action slot) and body. The structural unit that replaces the
// flat "everything stacked on one page" layout — each Panel owns one concern.
export type PanelAccent = "primary" | "success" | "warning" | "info" | "violet";

const ACCENT_DOT: Record<PanelAccent, string> = {
  primary: "bg-primary",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  info: "bg-blue-400",
  violet: "bg-violet-400",
};

export default function Panel({
  title,
  accent,
  action,
  children,
  bodyClassName = "p-4",
  className = "",
}: {
  title?: ReactNode;
  accent?: PanelAccent;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-hairline bg-surface-1 ${className}`}
    >
      {title || action ? (
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            {accent ? (
              <span
                className={`h-2 w-2 rounded-full ${ACCENT_DOT[accent]}`}
                aria-hidden
              />
            ) : null}
            {title}
          </span>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
