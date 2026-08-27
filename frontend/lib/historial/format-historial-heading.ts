import { startOfLocalWeekMonday } from "./group-workout-logs";

/**
 * Formato de los tres niveles de encabezado del historial
 * (`docs/design.md` §13.1-§13.5): un solo nivel enuncia la fecha completa
 * (el día), la semana es relativa solo cuando está en curso, y la hora de
 * la entrada nunca repite la fecha.
 */

function monthName(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * `Esta semana` para la semana en curso; si no, `Semana del D al D de mes`,
 * cruzando de mes si hace falta, y con el año pegado al extremo cuyo año
 * no es el actual (§13.3).
 */
export function formatWeekHeading(weekStart: Date, weekEnd: Date, today: Date = new Date()): string {
  if (weekStart.getTime() === startOfLocalWeekMonday(today).getTime()) {
    return "Esta semana";
  }

  const currentYear = today.getFullYear();
  const startYear = weekStart.getFullYear();
  const endYear = weekEnd.getFullYear();
  const startMonth = monthName(weekStart);
  const endMonth = monthName(weekEnd);
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();

  if (startYear !== endYear) {
    return `Semana del ${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
  }

  const sameMonth = startMonth === endMonth;
  const base = sameMonth
    ? `Semana del ${startDay} al ${endDay} de ${endMonth}`
    : `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;

  return startYear !== currentYear ? `${base} de ${startYear}` : base;
}

/**
 * `Lunes 18 de agosto`: día de semana con inicial mayúscula, número, mes
 * en minúscula, sin año y sin versalitas (§13.4).
 */
export function formatDayHeading(date: Date): string {
  const weekday = capitalize(new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date));
  const day = date.getDate();
  const month = monthName(date);
  return `${weekday} ${day} de ${month}`;
}

/**
 * Hora 24h `HH:mm` de la entrada. Se formatea a mano (sin `Intl`) para
 * evitar el "24:00" de medianoche que algunas implementaciones de ICU
 * devuelven con `hour12: false`.
 */
export function formatEntryTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
