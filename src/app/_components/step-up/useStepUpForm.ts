"use client";

import { useCallback, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useStepUpContext } from "./StepUpProvider";

/**
 * Drop-in replacement for useActionState for forms whose action may return a
 * `stepUp` marker. On that marker it opens the step-up modal and, after a
 * successful OTP verify, re-dispatches the same FormData.
 *
 * @param action Server action returning a state that may have a `stepUp` field
 * @param initialState Initial state value
 * @param fallbackPermission Permission string to use if action doesn't specify one
 */
export function useStepUpForm<S>(
  action: (prev: S, fd: FormData) => Promise<S>,
  initialState: Awaited<S>,
  fallbackPermission: string,
): [S, (fd: FormData) => void, boolean] {
  const { openStepUp } = useStepUpContext();
  const lastFd = useRef<FormData | null>(null);
  const formActionRef = useRef<((fd: FormData) => void) | null>(null);
  const retriedRef = useRef(false);

  const wrapped = useCallback(
    async (prev: unknown, fd: FormData): Promise<S> => {
      lastFd.current = fd;
      const result = await action(prev as S, fd);
      // Check if result has a stepUp field (duck typing)
      if (result && typeof result === "object" && "stepUp" in result && (result as Record<string, unknown>).stepUp) {
        if (retriedRef.current) {
          // Second consecutive step_up_required (e.g. jti changed) — stop, don't loop.
          retriedRef.current = false;
          return { ...result, stepUp: undefined, error: "Session changed — try again." } as S;
        }
        const stepUpField = (result as Record<string, unknown>).stepUp as { permission?: string };
        openStepUp({
          permission: stepUpField.permission ?? fallbackPermission,
          onVerified: () => {
            retriedRef.current = true;
            if (lastFd.current && formActionRef.current) {
              formActionRef.current(lastFd.current);
            }
          },
        });
        return result;
      }
      retriedRef.current = false;
      return result;
    },
    [action, openStepUp, fallbackPermission],
  );

  const [state, formAction, pending] = useActionState<S, FormData>(wrapped, initialState);
  useEffect(() => {
    formActionRef.current = formAction;
  }, [formAction]);
  return [state, formAction, pending];
}
