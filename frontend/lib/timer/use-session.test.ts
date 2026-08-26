import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionEngine } from "./use-session";
import { buildSessionPlan } from "./session-plan";
import type { RoutineDay, RoutineDayBlock } from "@/types/domain";

function day(blocks: RoutineDayBlock[]): RoutineDay {
  return { id: "d1", order: 0, blocks };
}

const block: RoutineDayBlock = {
  id: "b1",
  order: 0,
  name: "Fuerza EMOM",
  type: "fuerza",
  timerConfig: { totalDurationSeconds: 120, taskIntervalSeconds: 60 },
  advanceMode: "manual",
  exercises: [{ id: "be1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
};

describe("useSessionEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("arranca en idle y start() lo pasa a running", () => {
    const plan = buildSessionPlan(day([block]));
    const { result } = renderHook(() => useSessionEngine(plan));

    expect(result.current.view.status).toBe("idle");
    act(() => result.current.start());
    expect(result.current.view.status).toBe("running");
  });

  it("descuenta un segundo por cada tick del reloj real mientras corre", () => {
    const plan = buildSessionPlan(day([block]));
    const { result } = renderHook(() => useSessionEngine(plan));

    act(() => result.current.start());
    expect(result.current.view.remainingSeconds).toBe(60);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.view.remainingSeconds).toBe(57);
  });

  it("en pausa, el reloj real no descuenta más", () => {
    const plan = buildSessionPlan(day([block]));
    const { result } = renderHook(() => useSessionEngine(plan));

    act(() => result.current.start());
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.view.remainingSeconds).toBe(60);
    expect(result.current.view.status).toBe("paused");
  });

  it("expone avanzar y continueNextBlock", () => {
    const plan = buildSessionPlan(day([block]));
    const { result } = renderHook(() => useSessionEngine(plan));

    act(() => result.current.start());
    act(() => result.current.advance());
    act(() => result.current.advance());

    expect(result.current.view.status).toBe("finished");
  });
});
