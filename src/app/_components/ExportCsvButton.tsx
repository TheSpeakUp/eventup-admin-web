import { buttonClass, Icon } from "@/app/_components/ui";

// Layer-4 CSV export button — a plain download link to the /api/export proxy
// (server attaches the bearer token; `params` carries the table's CURRENT
// filters so the export matches what the operator is looking at).
export default function ExportCsvButton({
  surface,
  params,
}: {
  surface: string;
  params?: Record<string, string | undefined>;
}) {
  const qs = new URLSearchParams({ surface });
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") qs.set(key, value);
  }
  return (
    <a
      href={`/api/export?${qs.toString()}`}
      download
      data-testid={`export-csv-${surface}`}
      className={buttonClass("secondary", "sm")}
    >
      <Icon name="download" size={15} />
      Export CSV
    </a>
  );
}
