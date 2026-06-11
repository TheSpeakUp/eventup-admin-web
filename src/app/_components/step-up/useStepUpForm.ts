"use client";

import { useCallback, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useStepUpContext } from "./StepUpProvider";

type StepUpState = { stepUp?: { permission?: string } };

/**
 * Drop-in replacement for useActionState for forms whose action may return a
 * `stepUp` marker. On that marker it opens the step-up modal and, after a
 * successful OTP verify, re-dispatches the same FormData.
 */
export function useStepUpForm<S extends StepUpState = StepUpState>(
  action: (prev: S, fd: FormData) => Promise<S>,
  initialState: Awaited<S>,
  fallbackPermission: string,
): [S, (fd: FormData) => void, boolean] {
  const { openStepUp } = useStepUpContext();
  const lastFd = useRef<FormData | null>(null);
  const formActionRef = useRef<((fd: FormData) => void) | null>(null);
  const retriedRef = useRef(false);

  const wrapped: (prev: S, fd: FormData) => Promise<S> = useCallback(
    async (prev: S, fd: FormData): Promise<S> => {
      lastFd.current = fd;
      const result = await action(prev, fd);
      if (result.stepUp) {
        if (retriedRef.current) {
          // Second consecutive step_up_required (e.g. jti changed) — stop, don't loop.
          retriedRef.current = false;
          return { ...result, stepUp: undefined, error: "Session changed — try again." } as unknown as S;
        }
        openStepUp({
          permission: result.stepUp.permission ?? fallbackPermission,
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
