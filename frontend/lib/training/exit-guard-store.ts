/**
 * Guardia de salida de Modo entrenar (RN-010, `docs/design.md` §7.3).
 * `NavBar` es un componente global que no conoce el estado de la sesión de
 * entrenamiento; Modo entrenar registra acá una guardia mientras el timer
 * está en curso (running/paused/waiting-next-block). `NavBar` consulta la
 * guardia antes de dejar navegar un tab: si hay una activa, no navega y le
 * delega la decisión (mostrar el diálogo de confirmación de RN-010).
 */
export type ExitGuard = (href: string) => void;

let guard: ExitGuard | null = null;

export function setExitGuard(next: ExitGuard): void {
  guard = next;
}

export function clearExitGuard(): void {
  guard = null;
}

export function getExitGuard(): ExitGuard | null {
  return guard;
}

/** Usado por `NavBar`: si hay guardia, la dispara y devuelve `true` (navegación interceptada). */
export function requestGuardedNavigation(href: string): boolean {
  if (!guard) return false;
  guard(href);
  return true;
}
