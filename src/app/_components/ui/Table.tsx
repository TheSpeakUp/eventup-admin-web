import type { ComponentPropsWithoutRef } from "react";

/**
 * Table primitives with a single density spec. Sticky header
 * (`sticky top-0 bg-surface-1`), hairline row borders, hover `bg-surface-2`.
 * Replaces the px-2/py-1 vs px-4/py-2.5 padding drift across pages.
 *
 * Every primitive spreads `...rest`, so existing `data-testid` on the table
 * and rows is preserved. Header rows should use a plain `<tr>` inside <Thead>
 * (no hover); body rows use <Tr>.
 */

export function Table({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"table">) {
  return <table className={`w-full text-sm ${className}`} {...rest} />;
}

export function Thead({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={`sticky top-0 z-10 bg-surface-1 text-left text-xs font-medium uppercase tracking-wide text-ink-subtle ${className}`}
      {...rest}
    />
  );
}

export function Tbody({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={className} {...rest} />;
}

export function Tr({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={`border-t border-hairline hover:bg-surface-2 ${className}`}
      {...rest}
    />
  );
}

export function Th({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"th">) {
  return <th className={`px-3 py-2 font-medium ${className}`} {...rest} />;
}

export function Td({
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"td">) {
  return <td className={`px-3 py-2 align-middle ${className}`} {...rest} />;
}
