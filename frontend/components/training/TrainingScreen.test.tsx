import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainingScreen } from "./TrainingScreen";
import * as workoutLogsApi from "@/lib/api/workout-logs";
import { clearExitGuard, requestGuardedNavigation } from "@/lib/training/exit-guard-store";
import type { RoutineDayBlock } from "@/types/domain";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const exerciseNameById = new Map([["ex-1", "Goblet squats"]]);

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

  afterEach(() => {
    vi.useRealTimers();
    clearExitGuard();
    pushMock.mockClear();
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

    expect(createSpy).toHaveBeenCalledWith("r1", "d1");
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
});
