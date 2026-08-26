/**
 * Esqueleto con la forma del contenido real, nunca un spinner centrado a
 * pantalla completa (`docs/design.md` §6.4).
 */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          data-testid="skeleton-row"
          className="h-16 animate-pulse rounded-[var(--r-lg)]"
          style={{ background: "var(--surface-2)" }}
        />
      ))}
    </div>
  );
}
