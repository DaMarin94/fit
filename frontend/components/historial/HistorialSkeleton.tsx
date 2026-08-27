/**
 * Esqueleto de carga del Historial (`docs/design.md` §13.9): toma la forma
 * de la estructura de tres niveles (semana / día / tarjeta), no solo
 * tarjetas planas — una barra de encabezado de semana (20px, 45% de ancho),
 * una de encabezado de día (14px, 30%) por grupo de día, y sus tarjetas.
 */
export function HistorialSkeleton() {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col">
      <div
        data-testid="skeleton-week-bar"
        className="h-5 w-[45%] animate-pulse rounded-[var(--r-sm)]"
        style={{ background: "var(--surface-2)" }}
      />

      <div className="mt-3 flex flex-col">
        <div
          data-testid="skeleton-day-bar"
          className="h-3.5 w-[30%] animate-pulse rounded-[var(--r-sm)]"
          style={{ background: "var(--surface-2)" }}
        />
        <div className="mt-2 flex flex-col gap-3">
          <div
            data-testid="skeleton-card"
            className="h-16 animate-pulse rounded-[var(--r-lg)]"
            style={{ background: "var(--surface-2)" }}
          />
          <div
            data-testid="skeleton-card"
            className="h-16 animate-pulse rounded-[var(--r-lg)]"
            style={{ background: "var(--surface-2)" }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col">
        <div
          data-testid="skeleton-day-bar"
          className="h-3.5 w-[30%] animate-pulse rounded-[var(--r-sm)]"
          style={{ background: "var(--surface-2)" }}
        />
        <div className="mt-2 flex flex-col gap-3">
          <div
            data-testid="skeleton-card"
            className="h-16 animate-pulse rounded-[var(--r-lg)]"
            style={{ background: "var(--surface-2)" }}
          />
        </div>
      </div>
    </div>
  );
}
