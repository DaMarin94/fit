import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainingScreen } from "./TrainingScreen";
import * as workoutLogsApi from "@/lib/api/workout-logs";
import { clearExitGuard, requestGuardedNavigation } from "@/lib/training/exit-guard-store";
import { ApiError } from "@/lib/http/api-client";
import { deleteFitDbForTests } from "@/lib/offline/db";
import { enqueueWorkoutLog, listPendingWorkoutLogs } from "@/lib/offline/workout-log-queue";
import { runWorkoutLogSync } from "@/lib/offline/workout-log-sync-status";
import { clearToasts, getToasts } from "@/lib/toast/toast-store";
import type { RoutineDayBlock } from "@/types/domain";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const exerciseNameById = new Map([["ex-1", "Goblet squats"]]);

/**
 * Avanza el reloj falso en pasos chicos, con un `act()` por paso: un solo
 * salto grande puede dejar timers anidados (el cross-fade de `StatusPill`
 * agenda un `setTimeout` dentro de otro) sin la vuelta de render que
 * necesitan entre uno y el siguiente.
 */
async function advanceInSteps(totalMs: number, stepMs = 50) {
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await vi.advanceTimersByTimeAsync(stepMs);
    });
  }
}

function manualBlock(id: string, name: string): RoutineDayBlock {
  return {
    id,
    order: 0,
    name,
    type: "fuerza",
    timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
    advanceMode: "manual",
    exercises: [{ id: `be-${id}`, exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
  };
}

describe("TrainingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(async () => {
    vi.useRealTimers();
    clearExitGuard();
    pushMock.mockClear();
    clearToasts();
    vi.unstubAllGlobals();
    await deleteFitDbForTests();
  });

  it("listo para empezar: muestra la estructura del día y el botón de iniciar", () => {
    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar/i })).toBeInTheDocument();
  });

  it("al iniciar, muestra el timer corriendo con fase, ejercicio y reloj", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));

    expect(screen.getByText(/trabajo/i)).toBeInTheDocument();
    expect(screen.getByText(/goblet squats/i)).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("pausar detiene el reloj y oculta el color de fase; reanudar lo retoma", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    await user.click(screen.getByRole("button", { name: /pausar/i }));

    expect(screen.getByRole("button", { name: /reanudar/i })).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(3000);
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("con avance manual, al agotarse el bloque espera confirmación para el siguiente", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'"), manualBlock("b2", "Metcon")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    await user.click(screen.getByRole("button", { name: /avanzar/i }));

    expect(await screen.findByRole("button", { name: /continuar al siguiente bloque/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continuar al siguiente bloque/i }));
    expect(screen.getByText(/metcon/i)).toBeInTheDocument();
  });

  it("al terminar el día, ofrece terminar el entrenamiento y guarda el registro", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const createSpy = vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "2026-01-01T00:00:00.000Z",
      snapshot: { routineName: "Plan semanal", day: { order: 0 }, blocks: [] },
    });

    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    await user.click(screen.getByRole("button", { name: /avanzar/i }));

    await user.click(await screen.findByRole("button", { name: /terminar entrenamiento/i }));

    expect(createSpy).toHaveBeenCalledWith("r1", "d1", undefined, { silent: true });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("registra una guardia de salida mientras el timer está activo, y la saca al terminar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
      id: "w1",
      performedAt: "x",
      snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
    });

    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    expect(requestGuardedNavigation("/pool")).toBe(false);

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    expect(requestGuardedNavigation("/pool")).toBe(true);

    // La guardia abrió el diálogo de confirmación de salida (RN-010).
    expect(await screen.findByRole("alertdialog", { name: /salir del entrenamiento/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /salir y perder el progreso/i }));
    expect(pushMock).toHaveBeenCalledWith("/pool");
  });

  it("sin red al terminar: encola el registro localmente y no dispara el toast genérico de error", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockRejectedValue(
      new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR"),
    );

    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    await user.click(screen.getByRole("button", { name: /avanzar/i }));
    await user.click(await screen.findByRole("button", { name: /terminar entrenamiento/i }));
    // El encolado pasa por IndexedDB (`fake-indexeddb`), que resuelve por
    // task queue real; con fake timers activos hay que darle una vuelta.
    await vi.runAllTimersAsync();

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(requestGuardedNavigation("/pool")).toBe(false);

    const pending = await listPendingWorkoutLogs();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ routineId: "r1", dayId: "d1" });
    expect(getToasts()).toEqual([]);
  });

  it("si falla por un error real del servidor (no de red) al terminar, no encola, se queda en pantalla y sí dispara el toast genérico", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(workoutLogsApi, "createWorkoutLog").mockRejectedValue(
      new ApiError("Error del servidor.", "UNKNOWN_ERROR"),
    );

    render(
      <TrainingScreen
        routineId="r1"
        dayId="d1"
        routineName="Plan semanal"
        dayOrder={0}
        blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
        exerciseNameById={exerciseNameById}
      />,
    );

    await user.click(screen.getByRole("button", { name: /iniciar/i }));
    await user.click(screen.getByRole("button", { name: /avanzar/i }));
    await user.click(await screen.findByRole("button", { name: /terminar entrenamiento/i }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(await listPendingWorkoutLogs()).toEqual([]);
    expect(getToasts()).toEqual([{ id: expect.any(String), message: "Error del servidor.", variant: "error" }]);
  });

  describe("franja de estado sin conexión (docs/design.md §12)", () => {
    it("en 'Listo para empezar', sin red muestra la píldora neutra debajo del título", () => {
      vi.stubGlobal("navigator", { onLine: false });

      render(
        <TrainingScreen
          routineId="r1"
          dayId="d1"
          routineName="Plan semanal"
          dayOrder={0}
          blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
          exerciseNameById={exerciseNameById}
        />,
      );

      expect(screen.getByText("Sin conexión · se guarda al reconectar")).toBeInTheDocument();
    });

    it("en 'Listo para empezar', con red no muestra ninguna píldora", () => {
      vi.stubGlobal("navigator", { onLine: true });

      render(
        <TrainingScreen
          routineId="r1"
          dayId="d1"
          routineName="Plan semanal"
          dayOrder={0}
          blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
          exerciseNameById={exerciseNameById}
        />,
      );

      expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
    });

    it("con el timer corriendo y sin red, muestra la píldora en la franja reservada", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <TrainingScreen
          routineId="r1"
          dayId="d1"
          routineName="Plan semanal"
          dayOrder={0}
          blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
          exerciseNameById={exerciseNameById}
        />,
      );

      await user.click(screen.getByRole("button", { name: /iniciar/i }));

      expect(screen.getByText("Sin conexión · se guarda al reconectar")).toBeInTheDocument();
      // El texto de la franja vive fuera de la región aria-live del timer.
      const timerRegion = screen.getByText(/trabajo/i).closest('[aria-live="polite"]');
      expect(timerRegion).not.toBeNull();
      expect(within(timerRegion as HTMLElement).queryByText(/sin conexión/i)).not.toBeInTheDocument();
    });

    it("reconecta sin nada pendiente: la franja se retira sin pasar por 'Guardado'", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <TrainingScreen
          routineId="r1"
          dayId="d1"
          routineName="Plan semanal"
          dayOrder={0}
          blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
          exerciseNameById={exerciseNameById}
        />,
      );

      await user.click(screen.getByRole("button", { name: /iniciar/i }));
      expect(screen.getByText("Sin conexión · se guarda al reconectar")).toBeInTheDocument();

      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
      await act(async () => {
        window.dispatchEvent(new Event("online"));
        await runWorkoutLogSync();
      });

      expect(screen.queryByText("Guardado")).not.toBeInTheDocument();

      // Piso de permanencia (2s, §12.6) + fade de salida de la píldora (200ms, §9).
      await advanceInSteps(2600);

      expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
      expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
    });

    it("reconecta con un registro pendiente: pasa por 'Sincronizando' y después 'Guardado' antes de retirarse", async () => {
      vi.stubGlobal("navigator", { onLine: false });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      vi.spyOn(workoutLogsApi, "createWorkoutLog").mockResolvedValue({
        id: "w1",
        performedAt: "x",
        snapshot: { routineName: "x", day: { order: 0 }, blocks: [] },
      });
      await enqueueWorkoutLog("r1", "d0", "2026-08-26T10:00:00.000Z");

      render(
        <TrainingScreen
          routineId="r1"
          dayId="d1"
          routineName="Plan semanal"
          dayOrder={0}
          blocks={[manualBlock("b1", "Fuerza EMOM 12'")]}
          exerciseNameById={exerciseNameById}
        />,
      );

      await user.click(screen.getByRole("button", { name: /iniciar/i }));
      expect(screen.getByText("Sin conexión · se guarda al reconectar")).toBeInTheDocument();

      let syncPromise!: Promise<void>;
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
      await act(async () => {
        window.dispatchEvent(new Event("online"));
        syncPromise = runWorkoutLogSync();
        await syncPromise;
      });

      // La píldora ya visible ("Sin conexión") cambia de variante con un
      // cross-fade de 200ms (`docs/design.md` §12.6): hay que darle esa
      // vuelta antes de que el contenido muestre "Sincronizando".
      await advanceInSteps(300);
      expect(screen.getByText("Sincronizando")).toBeInTheDocument();

      // Mínimo de 1s en "Sincronizando" (§12.6) + cross-fade a "Guardado".
      await advanceInSteps(1500);
      expect(screen.getByText("Guardado")).toBeInTheDocument();

      // 3s en "Guardado" (§12.6) + fade de salida de la píldora (200ms, §9).
      await advanceInSteps(4000);
      expect(screen.queryByText("Guardado")).not.toBeInTheDocument();
      expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
    });
  });
});
