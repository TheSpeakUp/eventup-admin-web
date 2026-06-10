"use client";

import type { ListingStat } from "@/lib/traffic/types";

function csvCell(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  // Quote when the cell contains a comma, quote, or newline; escape quotes.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ExportCsvButton({
  rows,
  filename,
}: {
  rows: ListingStat[];
  filename: string;
}) {
  function handleExport() {
    const header = ["subject_id", "name", "provider_name", "views", "clicks", "ctr"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.subject_id,
          r.name,
          r.provider_name,
          r.views,
          r.clicks,
          r.ctr,
        ]
          .map(csvCell)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      data-testid="traffic-export-csv"
      className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
