import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOfflineIndicatorState } from "./use-offline-indicator-state";
import { runWorkoutLogSync } from "./workout-log-sync-status";
import { enqueueWorkoutLog } from "./workout-log-queue";
import { deleteFitDbForTests } from "./db";
import * as workoutLogsApi from "../api/workout-logs";

/**
 * Ejercita la máquina de estados de la franja de `docs/design.md` §12 de
 * punta a punta: dispara `runWorkoutLogSync` de verdad (con
 * `fake-indexeddb`) igual que lo haría `OfflineSyncListener`, y verifica
 * que el hook reacciona a sus eventos como lo haría montado en
 * `TrainingScreen`.
 */
describe("useOfflineIndicatorState", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await deleteFitDbForTests();
  });

  it("con red, arranca sin variante (franja vacía)", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useOfflineIndicatorState());
    expect(result.current).toBeNull();
  });

  it("sin red, arranca en variante 'offline'", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOfflineIndicatorState());
    expect(result.current).toBe("offline");
  });

  it("se cae la red durante el render: pasa a 'offline'", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useOfflineIndicatorState());
    expect(result.current).toBeNull();

    act(() => {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe("offline");
  });

  it("reconecta sin nada en cola: no pasa por 'syncing' ni 'saved', y se retira", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOfflineIndicatorState());
    expect(result.current).toBe("offline");

    await act(async () => {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
      window.dispatchEvent(new Event("online"));
      await runWorkoutLogSync();
    });

    expect(result.current).not.toBe("syncing");
    expect(result.current).not.toBe("saved");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(result.current).toBeNull();
  });

  it("reconecta con algo en cola: pasa a 'syncing' (mínimo 1s), después 'saved' (3s), y se retira", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "x",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOfflineIndicatorState());
    expect(result.current).toBe("offline");

    let syncPromise!: Promise<void>;
    act(() => {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
      window.dispatchEvent(new Event("online"));
      syncPromise = runWorkoutLogSync();
    });

    await act(async () => {
      await syncPromise;
    });

    expect(result.current).toBe("syncing");

    // Todavía no pasó el mínimo de 1s en pantalla.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current).toBe("syncing");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(result.current).toBe("saved");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(result.current).toBe("saved");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(result.current).toBeNull();
  });

  it("anti-parpadeo: si la red vuelve a caer mientras se procesaba la reconexión, se queda en 'offline' y no se retira", async () => {
    await enqueueWorkoutLog("r1", "d1", "2026-08-26T10:00:00.000Z");
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "x",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useOfflineIndicatorState());

    let syncPromise!: Promise<void>;
    act(() => {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
      window.dispatchEvent(new Event("online"));
      syncPromise = runWorkoutLogSync();
    });

    // Se vuelve a caer la red antes de que el sync resuelva.
    act(() => {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
      window.dispatchEvent(new Event("offline"));
    });

    await act(async () => {
      await syncPromise;
    });

    expect(result.current).toBe("offline");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // Sigue en "offline": el evento de sync que llegó tarde no debe pisar el estado real de la red.
    expect(result.current).toBe("offline");
  });
});
