"use client";

import { useEffect, useState } from "react";
import {
  advance as advanceEngine,
  continueNextBlock as continueNextBlockEngine,
  createInitialState,
  getView,
  pause as pauseEngine,
  resume as resumeEngine,
  start as startEngine,
  tick,
} from "./session-engine";
import type { SessionPlan, SessionState, SessionView } from "./types";

/**
 * Conecta el motor puro (`session-engine.ts`) al reloj real, vía
 * `setInterval` de 1s (RNF-004: el timer nunca depende de la red, solo del
 * reloj del dispositivo). Expone las acciones de RF-010/RF-011 listas
 * para la UI de Modo entrenar.
 */
export function useSessionEngine(plan: SessionPlan) {
  const [state, setState] = useState<SessionState>(() => createInitialState(plan));

  useEffect(() => {
    if (state.status !== "running") return;
    const interval = setInterval(() => {
      setState((prev) => tick(plan, prev, 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.status, plan]);

  const view: SessionView = getView(plan, state);

  return {
    state,
    view,
    start: () => setState((prev) => startEngine(plan, prev)),
    pause: () => setState((prev) => pauseEngine(plan, prev)),
    resume: () => setState((prev) => resumeEngine(plan, prev)),
    advance: () => setState((prev) => advanceEngine(plan, prev)),
    continueNextBlock: () => setState((prev) => continueNextBlockEngine(plan, prev)),
  };
}
