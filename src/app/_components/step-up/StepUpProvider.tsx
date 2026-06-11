"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import StepUpModal from "./StepUpModal";

export type StepUpRequest = {
  permission: string;
  onVerified: () => void;
};

type StepUpContextValue = {
  openStepUp: (req: StepUpRequest) => void;
};

const StepUpContext = createContext<StepUpContextValue | null>(null);

export function useStepUpContext(): StepUpContextValue {
  const ctx = useContext(StepUpContext);
  if (!ctx) throw new Error("useStepUpContext must be used within <StepUpProvider>");
  return ctx;
}

export default function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<StepUpRequest | null>(null);

  // Ignore new requests while a challenge is already active: the modal's
  // open-effect only (re)challenges on the rising edge of `request`, so
  // overwriting it would leave the visible challenge bound to action A while
  // verify fires action B's onVerified — a dead-end. First request wins; the
  // second form stays armed and re-fires once the modal closes.
  const openStepUp = useCallback((req: StepUpRequest) => {
    setRequest((cur) => cur ?? req);
  }, []);
  const close = useCallback(() => setRequest(null), []);

  const handleVerified = useCallback(() => {
    const cb = request?.onVerified;
    setRequest(null);
    cb?.();
  }, [request]);

  const value = useMemo(() => ({ openStepUp }), [openStepUp]);

  return (
    <StepUpContext.Provider value={value}>
      {children}
      <StepUpModal request={request} onClose={close} onVerified={handleVerified} />
    </StepUpContext.Provider>
  );
}
