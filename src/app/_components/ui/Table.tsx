import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

// Table primitives with one density spec + a sticky header. Replaces the
// per-page drift (px-2 py-1 vs px-4 py-2.5 vs py-2-no-px) and missing sticky
// headers that let column labels scroll out of view on long lists.

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-surface-2 text-left text-xs uppercase tracking-wider text-ink-subtle">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-t border-hairline first:border-t-0 hover:bg-surface-2 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}) {
  const a =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th className={`px-3 py-2.5 font-medium ${a} ${className}`} {...props}>
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}) {
  const a =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <td className={`px-3 py-2.5 text-ink ${a} ${className}`} {...props}>
      {children}
    </td>
  );
}
