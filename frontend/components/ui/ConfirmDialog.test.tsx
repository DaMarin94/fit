import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("no renderiza nada si open es false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="¿Borrar rutina?"
        description="Se borra la rutina Plan semanal."
        confirmLabel="Borrar rutina"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("muestra título, descripción y el verbo real en el botón de confirmar", () => {
    render(
      <ConfirmDialog
        open
        title="¿Borrar rutina?"
        description="Se borra la rutina Plan semanal."
        confirmLabel="Borrar rutina"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("alertdialog", { name: "¿Borrar rutina?" })).toBeInTheDocument();
    expect(screen.getByText("Se borra la rutina Plan semanal.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar rutina" })).toBeInTheDocument();
  });

  it("el foco inicial está en cancelar, el default seguro (RN-010)", () => {
    render(
      <ConfirmDialog
        open
        title="¿Salir del entrenamiento?"
        description="Se pierde el progreso de la sesión."
        confirmLabel="Salir y perder el progreso"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /cancelar/i })).toHaveFocus();
  });

  it("Escape y click en el backdrop cancelan", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="t"
        description="d"
        confirmLabel="Confirmar"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("confirm-dialog-backdrop"));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("confirma al tocar el botón de confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="t"
        description="d"
        confirmLabel="Borrar bloque"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Borrar bloque" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
