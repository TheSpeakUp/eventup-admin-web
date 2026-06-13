import type { LoginHistoryItem } from "@/lib/self/types";

function fmtDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function LoginHistoryTable({
  items,
}: {
  items: LoginHistoryItem[];
}) {
  if (items.length === 0) {
    return (
      <p data-testid="login-history-empty" className="text-sm text-zinc-500">
        No sign-in activity recorded yet.
      </p>
    );
  }
  return (
    <table className="w-full text-sm" data-testid="login-history-table">
      <thead>
        <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
          <th className="px-3 py-2 font-medium">When</th>
          <th className="px-3 py-2 font-medium">Result</th>
          <th className="px-3 py-2 font-medium">IP address</th>
          <th className="px-3 py-2 font-medium">Device</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-zinc-100">
            <td className="px-3 py-2 text-zinc-800">{fmtDate(item.occurred_at)}</td>
            <td className="px-3 py-2">
              <span
                className={
                  item.success
                    ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                    : "rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                }
              >
                {item.success ? "Success" : "Failed"}
              </span>
            </td>
            <td className="px-3 py-2 text-zinc-600">{item.ip_address ?? "—"}</td>
            <td className="px-3 py-2 text-zinc-500">
              <span className="block max-w-xs truncate" title={item.user_agent ?? ""}>
                {item.user_agent ?? "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
