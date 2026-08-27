import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistorialSkeleton } from "./HistorialSkeleton";

/**
 * El esqueleto de carga del historial toma la forma del contenido real
 * (`docs/design.md` §6.4, §13.9): incluye la forma de los encabezados de
 * semana y de día, no solo tarjetas planas.
 */
describe("HistorialSkeleton", () => {
  it("muestra barras con forma de encabezado de semana y de día, y tarjetas", () => {
    render(<HistorialSkeleton />);

    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-week-bar")).toHaveLength(1);
    expect(screen.getAllByTestId("skeleton-day-bar")).toHaveLength(2);
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3);
  });
});
