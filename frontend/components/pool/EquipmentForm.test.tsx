import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EquipmentForm } from "./EquipmentForm";
import { ApiError } from "@/lib/http/api-client";

describe("EquipmentForm", () => {
  it("valida nombre vacío antes de enviar (RN-005 vía Zod)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EquipmentForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear elemento" />);

    await user.click(screen.getByRole("button", { name: "Crear elemento" }));

    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía el nombre ingresado", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EquipmentForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear elemento" />);

    await user.type(screen.getByLabelText(/nombre/i), "Kettlebell");
    await user.click(screen.getByRole("button", { name: "Crear elemento" }));

    expect(onSubmit).toHaveBeenCalledWith("Kettlebell");
  });

  it("si el backend responde NAME_TAKEN, lo muestra como error de campo", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Ya existe un elemento con ese nombre.", "NAME_TAKEN"));
    render(<EquipmentForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear elemento" />);

    await user.type(screen.getByLabelText(/nombre/i), "Mancuernas");
    await user.click(screen.getByRole("button", { name: "Crear elemento" }));

    expect(await screen.findByText("Ya existe un elemento con ese nombre.")).toBeInTheDocument();
  });

  it("precarga el nombre inicial al editar", () => {
    render(
      <EquipmentForm
        initialName="Silla"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Guardar cambios"
      />,
    );
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Silla");
  });
});
