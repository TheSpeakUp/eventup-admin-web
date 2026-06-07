"use client";

import { useEffect } from "react";

export default function MockBackendBoot() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_BACKEND !== "true") return;
    let cancelled = false;
    void import("@/mocks/browser").then(({ mockWorker }) => {
      if (cancelled) return;
      void mockWorker.start({
        onUnhandledRequest: "bypass",
        quiet: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
