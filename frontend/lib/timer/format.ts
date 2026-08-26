/**
 * Formato de reloj para los numerales tabulares del timer (`docs/design.md`
 * §4.2): `MM:SS`, o `H:MM:SS` si el total llega a una hora. Redondea hacia
 * arriba: mientras quede una fracción de segundo, no se muestra `00:00`.
 */
export function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(Math.ceil(totalSeconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
