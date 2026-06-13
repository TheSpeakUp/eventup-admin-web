"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "./Icon";

const DEBOUNCE_MS = 300;

/**
 * Shared debounced list-search box. Generalises the per-domain `XFilters`
 * search inputs into one icon-prefixed, token-styled control that writes its
 * value to a URL query param (`param`) and resets the page cursor/offset on
 * change. Server components read the param back and re-query — so search state
 * is shareable and back-button friendly.
 *
 * Keep `testid` and `placeholder` stable per call site: the e2e suite resolves
 * these inputs by `data-testid` and accessible name.
 */
export default function SearchInput({
  param = "search",
  placeholder = "Search…",
  testid,
  resetParams = ["last_id", "offset"],
  widthClass = "w-64",
}: {
  param?: string;
  placeholder?: string;
  testid?: string;
  resetParams?: string[];
  widthClass?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(params.get(param) ?? "");
  const lastPushed = useRef<string>(params.toString());
  // Stable dep for the effect — `resetParams` is a fresh array each render.
  const resetKey = useMemo(() => resetParams.join(","), [resetParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(param, value);
      else next.delete(param);
      for (const p of resetKey ? resetKey.split(",") : []) next.delete(p);
      const serialized = next.toString();
      if (serialized === lastPushed.current) return;
      lastPushed.current = serialized;
      startTransition(() => {
        router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value, params, pathname, router, param, resetKey]);

  return (
    <div
      data-pending={pending ? "true" : "false"}
      className={`flex h-9 items-center gap-2 rounded-md border border-hairline bg-surface-2 px-3 ${widthClass} focus-within:border-hairline-strong`}
    >
      <Icon name="search" size={15} className="shrink-0 text-ink-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        data-testid={testid}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
      />
    </div>
  );
}
