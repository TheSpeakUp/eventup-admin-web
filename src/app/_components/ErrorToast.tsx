"use client";

import { useEffect } from "react";

export default function ErrorToast({
  message,
  onDismiss,
  autoDismissMs = 6000,
}: {
  message: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [message, onDismiss, autoDismissMs]);

  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="error-toast"
      className="fixed top-4 right-4 z-50 max-w-md rounded-md border border-red-300 bg-red-50 p-3 shadow-md"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-red-800">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          data-testid="error-toast-dismiss"
          aria-label="Dismiss"
          className="text-red-700 hover:text-red-900"
        >
          ×
        </button>
      </div>
    </div>
  );
}
