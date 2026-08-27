import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HistorialPage from "./page";
import * as workoutLogsApi from "@/lib/api/workout-logs";
import { formatEntryTime } from "@/lib/historial/format-historial-heading";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("HistorialPage", () => {
  it("muestra el esqueleto mientras carga", () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockReturnValue(new Promise(() => {}));
    render(<HistorialPage />);
    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
  });

  it("vacío: mensaje + CTA a Mis rutinas como botón primario (design §13.9)", async () => {
    const user = userEvent.setup();
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([]);
    render(<HistorialPage />);
    expect(await screen.findByText(/todavía no entrenaste/i)).toBeInTheDocument();

    const cta = screen.getByRole("button", { name: /ir a mis rutinas/i });
    expect(cta).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ir a mis rutinas/i })).not.toBeInTheDocument();

    await user.click(cta);
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("la tarjeta muestra la hora (HH:mm) y la rutina, nunca la fecha completa (design §13.1, §13.5)", async () => {
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
    expect(within(item).getByText("Plan semanal")).toBeInTheDocument();
    expect(within(item).getByText(formatEntryTime("2026-08-20T10:00:00.000Z"))).toBeInTheDocument();
    expect(screen.queryByText(/agosto de 2026/i)).not.toBeInTheDocument();
  });

  it("el encabezado de día usa el formato 'Miércoles 19 de agosto', sin año (design §13.4)", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-19T20:00:00",
        snapshot: { routineName: "Plan A", day: { order: 0 }, blocks: [] },
      },
    ]);

    render(<HistorialPage />);
    await screen.findByText("Plan A");
    expect(screen.getByRole("heading", { level: 3, name: "Miércoles 19 de agosto" })).toBeInTheDocument();
  });

  it("el chevron de la tarjeta indica el estado cerrado/abierto (design §13.5)", async () => {
    const user = userEvent.setup();
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-20T10:00:00.000Z",
        snapshot: { routineName: "Plan semanal", day: { order: 0 }, blocks: [] },
      },
    ]);

    render(<HistorialPage />);
    const item = await screen.findByRole("button", { name: /ver detalle de plan semanal/i });
    const chevron = within(item).getByTestId("chevron-icon");
    expect(chevron.getAttribute("class")).not.toMatch(/rotate-180/);

    await user.click(item);
    expect(chevron.getAttribute("class")).toMatch(/rotate-180/);
  });

  it("agrupa por semana y día (RN-012): logs de semanas distintas quedan bajo encabezados de semana separados", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-24T10:00:00", // lunes, semana del 24/08
        snapshot: { routineName: "Plan A", day: { order: 0 }, blocks: [] },
      },
      {
        id: "w2",
        performedAt: "2026-08-17T10:00:00", // lunes, semana del 17/08
        snapshot: { routineName: "Plan B", day: { order: 0 }, blocks: [] },
      },
    ]);

    render(<HistorialPage />);
    await screen.findByText("Plan A");

    const weekHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(weekHeadings).toHaveLength(2);
    const dayHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(dayHeadings).toHaveLength(2);
  });

  it("agrupa por día calendario (RN-012): dos logs del mismo día quedan bajo un único encabezado de día", async () => {
    vi.spyOn(workoutLogsApi, "listWorkoutLogs").mockResolvedValue([
      {
        id: "w1",
        performedAt: "2026-08-19T20:00:00",
        snapshot: { routineName: "Plan A", day: { order: 0 }, blocks: [] },
      },
      {
        id: "w2",
        performedAt: "2026-08-19T07:00:00",
        snapshot: { routineName: "Plan B", day: { order: 0 }, blocks: [] },
      },
    ]);

    render(<HistorialPage />);
    await screen.findByText("Plan A");
    await screen.findByText("Plan B");

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
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
