import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickSelector } from "./QuickSelector";

const items = [
  { id: "1", name: "Fuerza EMOM 12'" },
  { id: "2", name: "Metcon AMRAP 6'" },
  { id: "3", name: "Trote" },
];

describe("QuickSelector", () => {
  it("no renderiza nada si open es false", () => {
    render(
      <QuickSelector
        open={false}
        title="Elegí un bloque"
        items={items}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lista los ítems del pool y elige uno", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={items}
        onSelect={onSelect}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Elegí un bloque" })).toBeInTheDocument();
    for (const item of items) {
      expect(screen.getByRole("button", { name: item.name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Trote" }));
    expect(onSelect).toHaveBeenCalledWith("3");
  });

  it("filtra por nombre", async () => {
    const user = userEvent.setup();
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={items}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "metcon");
    expect(screen.getByRole("button", { name: "Metcon AMRAP 6'" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trote" })).not.toBeInTheDocument();
  });

  it("búsqueda sin resultados: mensaje", async () => {
    const user = userEvent.setup();
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={items}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText(/no encontramos/i)).toBeInTheDocument();
  });

  it("pool vacío: mensaje + CTA a crear", async () => {
    const user = userEvent.setup();
    const onEmptyAction = vi.fn();
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={[]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={onEmptyAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Crear bloque" }));
    expect(onEmptyAction).toHaveBeenCalledTimes(1);
  });

  it("cargando: estado de carga cuando items es null", () => {
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={null}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );
    expect(screen.getByRole("status", { name: /cargando/i })).toBeInTheDocument();
  });

  it("cerrar con el botón de cerrar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <QuickSelector
        open
        title="Elegí un bloque"
        items={items}
        onSelect={vi.fn()}
        onClose={onClose}
        emptyActionLabel="Crear bloque"
        onEmptyAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
