import { describe, expect, it } from "vitest";
import { groupWorkoutLogsByWeek } from "./group-workout-logs";
import type { WorkoutLog } from "@/types/domain";

/**
 * RN-012 (`docs/requirements.md`): el historial se agrupa por día
 * calendario y por semana (lunes a domingo), calculados con hora LOCAL
 * del dispositivo. Las fechas de prueba usan el formato ISO sin sufijo
 * de zona horaria (`YYYY-MM-DDTHH:mm:ss`) a propósito: ECMA-262 las
 * interpreta como hora local, igual que hace la función bajo test —así
 * el resultado no depende de en qué huso horario corra la suite.
 */

function log(id: string, performedAt: string): WorkoutLog {
  return {
    id,
    performedAt,
    snapshot: {
      routineName: "Plan semanal",
      day: { order: 0 },
      blocks: [],
    },
  };
}

describe("groupWorkoutLogsByWeek", () => {
  it("lista vacía devuelve sin semanas", () => {
    expect(groupWorkoutLogsByWeek([])).toEqual([]);
  });

  it("agrupa logs de la misma semana pero distinto día calendario en la misma semana, días separados", () => {
    // Lunes 2026-08-17 y miércoles 2026-08-19: misma semana (lu-do).
    const logs = [log("a", "2026-08-19T09:00:00"), log("b", "2026-08-17T09:00:00")];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks).toHaveLength(1);
    expect(weeks[0].days).toHaveLength(2);
    expect(weeks[0].days.map((d) => d.logs.map((l) => l.id))).toEqual([["a"], ["b"]]);
  });

  it("agrupa logs de distinta semana en semanas separadas", () => {
    // Lunes 2026-08-17 (semana 1) y lunes 2026-08-24 (semana 2).
    const logs = [log("a", "2026-08-24T09:00:00"), log("b", "2026-08-17T09:00:00")];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks).toHaveLength(2);
    expect(weeks[0].days[0].logs.map((l) => l.id)).toEqual(["a"]);
    expect(weeks[1].days[0].logs.map((l) => l.id)).toEqual(["b"]);
  });

  it("agrupa varios logs del mismo día calendario dentro del mismo grupo de día", () => {
    const logs = [
      log("a", "2026-08-19T20:00:00"),
      log("b", "2026-08-19T07:00:00"),
    ];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks).toHaveLength(1);
    expect(weeks[0].days).toHaveLength(1);
    expect(weeks[0].days[0].logs.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("corta la semana exactamente en el límite domingo 23:59:59 / lunes 00:00:00", () => {
    // Domingo 2026-08-23 23:59:59 (fin de la semana del 17) vs.
    // lunes 2026-08-24 00:00:00 (inicio de la semana siguiente).
    const logs = [log("a", "2026-08-24T00:00:00"), log("b", "2026-08-23T23:59:59")];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks).toHaveLength(2);
    expect(weeks[0].days[0].logs.map((l) => l.id)).toEqual(["a"]);
    expect(weeks[1].days[0].logs.map((l) => l.id)).toEqual(["b"]);
  });

  it("preserva el orden de entrada (más reciente primero, como ya viene del backend)", () => {
    // "c" cae en la semana del 24/08; "b" y "a" en la semana del 17/08,
    // en días distintos dentro de esa misma semana.
    const logs = [
      log("c", "2026-08-24T09:00:00"),
      log("b", "2026-08-19T09:00:00"),
      log("a", "2026-08-17T09:00:00"),
    ];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks.map((w) => w.days.map((d) => d.logs.map((l) => l.id)))).toEqual([[["c"]], [["b"], ["a"]]]);
  });

  it("cada semana expone el lunes de inicio y el domingo de fin (hora local, sin componente horaria)", () => {
    const logs = [log("a", "2026-08-19T09:00:00")];

    const weeks = groupWorkoutLogsByWeek(logs);

    expect(weeks[0].weekStart.getFullYear()).toBe(2026);
    expect(weeks[0].weekStart.getMonth()).toBe(7); // agosto (0-index)
    expect(weeks[0].weekStart.getDate()).toBe(17);
    expect(weeks[0].weekStart.getDay()).toBe(1); // lunes

    expect(weeks[0].weekEnd.getDate()).toBe(23);
    expect(weeks[0].weekEnd.getDay()).toBe(0); // domingo
  });

  it("cada día del grupo expone la fecha calendario (hora local, sin componente horaria)", () => {
    const logs = [log("a", "2026-08-19T22:30:00")];

    const weeks = groupWorkoutLogsByWeek(logs);
    const day = weeks[0].days[0];

    expect(day.date.getFullYear()).toBe(2026);
    expect(day.date.getMonth()).toBe(7);
    expect(day.date.getDate()).toBe(19);
    expect(day.date.getHours()).toBe(0);
  });
});
