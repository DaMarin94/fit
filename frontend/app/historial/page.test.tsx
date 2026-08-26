import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HistorialPage from "./page";
import * as workoutLogsApi from "@/lib/api/workout-logs";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("HistorialPage", () => {
  it("muestra el esqueleto mientras carga", () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockReturnValue(new Promise(() => {}));
    render(<HistorialPage />);
    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
  });

  it("vacío: mensaje + CTA a Mis rutinas", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([]);
    render(<HistorialPage />);
    expect(await screen.findByText(/todavía no entrenaste/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir a mis rutinas/i })).toHaveAttribute("href", "/");
  });

  it("lista los entrenamientos con fecha y rutina", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-20T10:00:00.000Z",
        snapshot: {
          routineName: "Plan semanal",
          day: { order: 0 },
          blocks: [
            {
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
              advanceMode: "manual",
              exercises: [{ name: "Goblet squats", order: 0, reps: 12, duration: null, equipmentGroups: [["Kettlebell"]] }],
            },
          ],
        },
      },
    ]);

    render(<HistorialPage />);
    expect(await screen.findByText("Plan semanal")).toBeInTheDocument();
  });

  it("click abre el detalle del snapshot completo", async () => {
    const user = userEvent.setup();
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-20T10:00:00.000Z",
        snapshot: {
          routineName: "Plan semanal",
          day: { order: 0 },
          blocks: [
            {
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
              advanceMode: "manual",
              exercises: [{ name: "Goblet squats", order: 0, reps: 12, duration: null, equipmentGroups: [["Kettlebell"]] }],
            },
          ],
        },
      },
    ]);

    render(<HistorialPage />);
    const item = await screen.findByRole("button", { name: /ver detalle de plan semanal/i });
    await user.click(item);

    const detail = screen.getByTestId("workout-log-detail");
    expect(within(detail).getByText("Fuerza EMOM 12'")).toBeInTheDocument();
    expect(within(detail).getByText(/goblet squats/i)).toBeInTheDocument();
    expect(within(detail).getByText("Kettlebell")).toBeInTheDocument();
  });

  it("detalle: ejercicio con varios grupos de equipo muestra los conectores O/Y, y sin equipo muestra el texto gris", async () => {
    const user = userEvent.setup();
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-20T10:00:00.000Z",
        snapshot: {
          routineName: "Plan semanal",
          day: { order: 0 },
          blocks: [
            {
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
              advanceMode: "manual",
              exercises: [
                {
                  name: "Goblet squats",
                  order: 0,
                  reps: 12,
                  duration: null,
                  equipmentGroups: [["Kettlebell", "Mancuerna"], ["Colchoneta"]],
                },
                { name: "Burpees", order: 1, reps: 10, duration: null, equipmentGroups: [] },
              ],
            },
          ],
        },
      },
    ]);

    render(<HistorialPage />);
    const item = await screen.findByRole("button", { name: /ver detalle de plan semanal/i });
    await user.click(item);

    const detail = screen.getByTestId("workout-log-detail");
    expect(within(detail).getByText("Kettlebell")).toBeInTheDocument();
    expect(within(detail).getByText("Mancuerna")).toBeInTheDocument();
    expect(within(detail).getByText("Colchoneta")).toBeInTheDocument();
    expect(within(detail).getByText("o")).toBeInTheDocument();
    expect(within(detail).getByText("Y")).toBeInTheDocument();
    expect(within(detail).getByText("Sin equipo")).toBeInTheDocument();
  });

  it("error con reintentar", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockRejectedValue(new Error("x"));
    render(<HistorialPage />);
    expect(await screen.findByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });
});
