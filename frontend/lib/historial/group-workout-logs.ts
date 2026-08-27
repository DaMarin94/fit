import type { WorkoutLog } from "@/types/domain";

/**
 * Agrupación del historial por día calendario y por semana (RN-012,
 * `docs/requirements.md`): el día calendario se determina con la hora
 * LOCAL del dispositivo (no UTC), y la semana va de lunes a domingo,
 * igual que el plan semanal.
 *
 * El orden interno de los grupos respeta el orden de entrada de `logs`
 * (el backend ya devuelve `performedAt: 'desc'`, más reciente primero) —
 * esta función no reordena, solo agrupa.
 */

export type HistorialDayGroup = {
  /** Clave estable del día calendario local, `YYYY-MM-DD`. */
  dateKey: string;
  /** Medianoche local de ese día calendario. */
  date: Date;
  logs: WorkoutLog[];
};

export type HistorialWeekGroup = {
  /** Clave estable de la semana, `YYYY-MM-DD` del lunes de inicio. */
  weekKey: string;
  /** Medianoche local del lunes de esa semana. */
  weekStart: Date;
  /** Medianoche local del domingo de esa semana. */
  weekEnd: Date;
  days: HistorialDayGroup[];
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Exportado para reutilizar en `format-historial-heading.ts` (§13.3: "Esta semana"). */
export function startOfLocalWeekMonday(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay(); // 0 = domingo ... 6 = sábado
  const daysSinceMonday = (weekday + 6) % 7;
  day.setDate(day.getDate() - daysSinceMonday);
  return day;
}

function toDateKey(date: Date): string {
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function groupWorkoutLogsByWeek(logs: WorkoutLog[]): HistorialWeekGroup[] {
  const weeks: HistorialWeekGroup[] = [];
  const weekByKey = new Map<string, HistorialWeekGroup>();
  const dayByKey = new Map<string, HistorialDayGroup>();

  for (const log of logs) {
    const performedAt = new Date(log.performedAt);
    const weekStart = startOfLocalWeekMonday(performedAt);
    const weekKey = toDateKey(weekStart);

    let week = weekByKey.get(weekKey);
    if (!week) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      week = { weekKey, weekStart, weekEnd, days: [] };
      weekByKey.set(weekKey, week);
      weeks.push(week);
    }

    const day = startOfLocalDay(performedAt);
    const dayKey = `${weekKey}:${toDateKey(day)}`;

    let dayGroup = dayByKey.get(dayKey);
    if (!dayGroup) {
      dayGroup = { dateKey: toDateKey(day), date: day, logs: [] };
      dayByKey.set(dayKey, dayGroup);
      week.days.push(dayGroup);
    }

    dayGroup.logs.push(log);
  }

  return weeks;
}
