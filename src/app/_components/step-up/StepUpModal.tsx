"use client";

import { useEffect, useRef, useState } from "react";
import { requestStepUpChallenge, verifyStepUp } from "@/app/step-up/actions";
import type { StepUpRequest } from "./StepUpProvider";

type Phase = "challenging" | "awaiting_code" | "verifying" | "error";

export default function StepUpModal({
  request,
  onClose,
  onVerified,
}: {
  request: StepUpRequest | null;
  onClose: () => void;
  onVerified: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("challenging");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Open/close the native dialog in step with `request`.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (request && !el.open) {
      setPhase("challenging");
      setCode("");
      setError(null);
      setChallengeId(null);
      el.showModal();
      void startChallenge();
    } else if (!request && el.open) {
      el.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  async function startChallenge() {
    if (!request) return;
    const res = await requestStepUpChallenge([request.permission]);
    if (!res.ok) {
      setError(res.error);
      setPhase("error");
      return;
    }
    setChallengeId(res.challengeId);
    setHint(res.deliveryHint);
    setPhase("awaiting_code");
  }

  async function submitCode() {
    if (!challengeId) return;
    setPhase("verifying");
    setError(null);
    const res = await verifyStepUp(challengeId, code);
    if (res.ok) {
      onVerified();
      return;
    }
    setError(res.error);
    setPhase(res.attemptsExceeded ? "error" : "awaiting_code");
  }

  return (
    <dialog
      ref={dialogRef}
      data-testid="step-up-modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="rounded-lg p-0 backdrop:bg-black/40"
    >
      <div className="w-80 space-y-3 p-5">
        <h2 className="text-sm font-semibold">Verification required</h2>
        {phase === "challenging" ? (
          <p className="text-xs text-zinc-600">Sending a code…</p>
        ) : null}
        {phase === "awaiting_code" || phase === "verifying" ? (
          <>
            <p className="text-xs text-zinc-600">
              Enter the 6-digit code sent to {hint}.
            </p>
            <input
              data-testid="step-up-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-lg tracking-widest"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <div className="flex justify-between gap-2">
              <button
                type="button"
                data-testid="step-up-resend"
                onClick={() => void startChallenge()}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
              >
                Resend
              </button>
              <button
                type="button"
                data-testid="step-up-submit"
                disabled={code.length !== 6 || phase === "verifying"}
                onClick={() => void submitCode()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400"
              >
                {phase === "verifying" ? "Verifying…" : "Verify"}
              </button>
            </div>
          </>
        ) : null}
        {phase === "error" ? (
          <>
            <p data-testid="step-up-error" className="text-xs text-red-600">
              {error ?? "Verification unavailable."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          </>
        ) : null}
        {phase !== "error" ? (
          <button
            type="button"
            data-testid="step-up-cancel"
            onClick={onClose}
            className="text-xs text-zinc-500 underline"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
