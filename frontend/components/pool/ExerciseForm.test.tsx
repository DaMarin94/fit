import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseForm } from "./ExerciseForm";
import { ApiError } from "@/lib/http/api-client";

describe("ExerciseForm", () => {
  it("valida nombre vacío antes de enviar (feedback temprano, RN-006/RN-005 vía Zod)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExerciseForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear ejercicio" />);

    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía el nombre ingresado", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ExerciseForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear ejercicio" />);

    await user.type(screen.getByLabelText(/nombre/i), "Sentadillas");
    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(onSubmit).toHaveBeenCalledWith("Sentadillas");
  });

  it("si el backend responde NAME_TAKEN, lo muestra como error de campo", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Ya existe un ejercicio con ese nombre.", "NAME_TAKEN"));
    render(<ExerciseForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Crear ejercicio" />);

    await user.type(screen.getByLabelText(/nombre/i), "Burpees");
    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(await screen.findByText("Ya existe un ejercicio con ese nombre.")).toBeInTheDocument();
  });

  it("precarga el nombre inicial al editar", () => {
    render(
      <ExerciseForm
        initialName="Push ups"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Guardar"
      />,
    );
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Push ups");
  });
});
