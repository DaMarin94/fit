import { describe, expect, it } from "vitest";
import { formatDayHeading, formatEntryTime, formatWeekHeading } from "./format-historial-heading";

/**
 * Formato de los encabezados del historial (`docs/design.md` §13.3-§13.5).
 * `today` se inyecta explícito en cada caso para no depender de la fecha
 * real de ejecución de la suite.
 */

describe("formatWeekHeading", () => {
  it('semana en curso: "Esta semana", sin rango de fechas', () => {
    const today = new Date("2026-08-19T12:00:00");
    const weekStart = new Date(2026, 7, 17); // lunes 17/08
    const weekEnd = new Date(2026, 7, 23); // domingo 23/08

    expect(formatWeekHeading(weekStart, weekEnd, today)).toBe("Esta semana");
  });

  it("semana pasada dentro del mismo mes: rango sin año", () => {
    const today = new Date("2026-08-27T12:00:00");
    const weekStart = new Date(2026, 7, 18);
    const weekEnd = new Date(2026, 7, 24);

    expect(formatWeekHeading(weekStart, weekEnd, today)).toBe("Semana del 18 al 24 de agosto");
  });

  it("semana que cruza de mes, año en curso: nombra los dos meses, sin año", () => {
    const today = new Date("2026-08-27T12:00:00");
    const weekStart = new Date(2026, 6, 28); // 28 de julio
    const weekEnd = new Date(2026, 7, 3); // 3 de agosto

    expect(formatWeekHeading(weekStart, weekEnd, today)).toBe("Semana del 28 de julio al 3 de agosto");
  });

  it("semana de otro año, mismo mes: incluye el año una sola vez, al final", () => {
    const today = new Date("2026-08-27T12:00:00");
    const weekStart = new Date(2025, 11, 16); // 16 de diciembre de 2025
    const weekEnd = new Date(2025, 11, 22);

    expect(formatWeekHeading(weekStart, weekEnd, today)).toBe("Semana del 16 al 22 de diciembre de 2025");
  });

  it("semana que cruza de año: incluye el año en los dos extremos", () => {
    const today = new Date("2026-08-27T12:00:00");
    const weekStart = new Date(2025, 11, 29); // 29 de diciembre de 2025
    const weekEnd = new Date(2026, 0, 4); // 4 de enero de 2026

    expect(formatWeekHeading(weekStart, weekEnd, today)).toBe(
      "Semana del 29 de diciembre de 2025 al 4 de enero de 2026",
    );
  });
});

describe("formatDayHeading", () => {
  it('formatea "Lunes 18 de agosto": día de semana con inicial mayúscula, mes en minúscula, sin año', () => {
    const date = new Date(2026, 7, 17); // lunes 17/08/2026
    expect(formatDayHeading(date)).toBe("Lunes 17 de agosto");
  });

  it("miércoles 19/08/2026, sin mayúsculas sostenidas", () => {
    const date = new Date(2026, 7, 19);
    expect(formatDayHeading(date)).toBe("Miércoles 19 de agosto");
  });
});

describe("formatEntryTime", () => {
  it("formatea la hora en 24h HH:mm, con ceros a la izquierda", () => {
    const iso = new Date(2026, 7, 19, 9, 5, 0).toISOString();
    expect(formatEntryTime(iso)).toBe("09:05");
  });

  it("no usa AM/PM ni cambia a formato 12h", () => {
    const iso = new Date(2026, 7, 19, 19, 30, 0).toISOString();
    expect(formatEntryTime(iso)).toBe("19:30");
  });

  it("medianoche se formatea como 00:00, nunca 24:00", () => {
    const iso = new Date(2026, 7, 19, 0, 0, 0).toISOString();
    expect(formatEntryTime(iso)).toBe("00:00");
  });
});
