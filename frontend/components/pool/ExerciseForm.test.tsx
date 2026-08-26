import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseForm } from "./ExerciseForm";
import { ApiError } from "@/lib/http/api-client";
import type { Equipment } from "@/types/domain";

const poolEquipment: Equipment[] = [
  { id: "eq-1", name: "Kettlebell", deletedAt: null },
  { id: "eq-2", name: "Mancuernas", deletedAt: null },
  { id: "eq-3", name: "Banco", deletedAt: null },
];

function renderForm(props: Partial<React.ComponentProps<typeof ExerciseForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const onCreateEquipment = vi.fn();
  const utils = render(
    <ExerciseForm
      submitLabel="Crear ejercicio"
      onSubmit={onSubmit}
      onCancel={onCancel}
      poolEquipment={poolEquipment}
      onCreateEquipment={onCreateEquipment}
      {...props}
    />,
  );
  return { ...utils, onSubmit, onCancel, onCreateEquipment };
}

describe("ExerciseForm", () => {
  it("valida nombre vacío antes de enviar (feedback temprano, RN-006/RN-005 vía Zod)", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía el nombre ingresado con equipmentGroups vacío por defecto", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/nombre/i), "Burpees");
    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Burpees", equipmentGroups: [] });
  });

  it("si el backend responde NAME_TAKEN, lo muestra como error de campo", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Ya existe un ejercicio con ese nombre.", "NAME_TAKEN"));
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/nombre/i), "Burpees");
    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(await screen.findByText("Ya existe un ejercicio con ese nombre.")).toBeInTheDocument();
  });

  it("precarga el nombre inicial al editar", () => {
    renderForm({ initialName: "Push ups", submitLabel: "Guardar" });
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Push ups");
  });

  it("sin grupos: muestra el texto de peso corporal y el botón Agregar equipo, sin ícono de estado vacío", () => {
    renderForm();

    expect(screen.getByText(/sin equipo\. se hace con el peso del cuerpo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar equipo" })).toBeInTheDocument();
  });

  it("precarga los grupos existentes como tarjetas separadas por el conector Y", () => {
    renderForm({ initialEquipmentGroups: [["eq-2"], ["eq-3"]] });

    expect(screen.getByText("Mancuernas")).toBeInTheDocument();
    expect(screen.getByText("Banco")).toBeInTheDocument();
    expect(screen.getByText("Y")).toBeInTheDocument();
    expect(screen.queryByText(/sin equipo/i)).not.toBeInTheDocument();
  });

  it("un grupo con dos alternativas muestra el conector 'o' entre las filas", () => {
    renderForm({ initialEquipmentGroups: [["eq-1", "eq-2"]] });

    expect(screen.getByText("Kettlebell")).toBeInTheDocument();
    expect(screen.getByText("Mancuernas")).toBeInTheDocument();
    expect(screen.getByText("o")).toBeInTheDocument();
  });

  it("Agregar equipo abre el selector y crear el primer grupo con el elemento elegido", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Agregar equipo" }));
    expect(screen.getByRole("dialog", { name: "Agregar equipo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kettlebell" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Kettlebell")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar otro equipo" })).toBeInTheDocument();
  });

  it("cerrar el selector de 'Agregar equipo' sin elegir no crea ningún grupo", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Agregar equipo" }));
    await user.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/sin equipo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar equipo" })).toBeInTheDocument();
  });

  it("Agregar alternativa suma un elemento al grupo existente (conector 'o')", async () => {
    const user = userEvent.setup();
    renderForm({ initialEquipmentGroups: [["eq-1"]] });

    await user.click(screen.getByRole("button", { name: "Agregar alternativa" }));
    expect(screen.getByRole("dialog", { name: "Agregar alternativa" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mancuernas" }));

    expect(screen.getByText("Kettlebell")).toBeInTheDocument();
    expect(screen.getByText("Mancuernas")).toBeInTheDocument();
    expect(screen.getByText("o")).toBeInTheDocument();
  });

  it("quitar el único elemento de un grupo hace desaparecer la tarjeta completa", async () => {
    const user = userEvent.setup();
    renderForm({ initialEquipmentGroups: [["eq-1"]] });

    expect(screen.getByText("Kettlebell")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar Kettlebell" }));

    expect(screen.queryByText("Kettlebell")).not.toBeInTheDocument();
    expect(screen.getByText(/sin equipo/i)).toBeInTheDocument();
  });

  it("quitar una alternativa de un grupo con dos elementos no borra el grupo", async () => {
    const user = userEvent.setup();
    renderForm({ initialEquipmentGroups: [["eq-1", "eq-2"]] });

    await user.click(screen.getByRole("button", { name: "Quitar Kettlebell" }));

    expect(screen.queryByText("Kettlebell")).not.toBeInTheDocument();
    expect(screen.getByText("Mancuernas")).toBeInTheDocument();
    expect(screen.queryByText(/sin equipo/i)).not.toBeInTheDocument();
  });

  it("el pool de elementos vacío muestra el CTA para crear uno, y el botón de guardar nunca se bloquea", async () => {
    const user = userEvent.setup();
    const { onCreateEquipment } = renderForm({ poolEquipment: [] });

    expect(screen.getByRole("button", { name: "Crear ejercicio" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Agregar equipo" }));
    await user.click(screen.getByRole("button", { name: "Crear elemento" }));

    expect(onCreateEquipment).toHaveBeenCalledTimes(1);
  });

  it("envía name + equipmentGroups armados al confirmar", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ initialName: "Remos" });

    await user.click(screen.getByRole("button", { name: "Agregar equipo" }));
    await user.click(screen.getByRole("button", { name: "Kettlebell" }));
    await user.click(screen.getByRole("button", { name: "Agregar alternativa" }));
    await user.click(screen.getByRole("button", { name: "Mancuernas" }));

    await user.click(screen.getByRole("button", { name: "Crear ejercicio" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Remos", equipmentGroups: [["eq-1", "eq-2"]] });
  });
});
