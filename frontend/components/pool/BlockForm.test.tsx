import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockForm } from "./BlockForm";
import type { Exercise } from "@/types/domain";

const poolExercises: Exercise[] = [
  { id: "ex-1", name: "Goblet squats", deletedAt: null },
  { id: "ex-2", name: "Burpees", deletedAt: null },
];

describe("BlockForm", () => {
  it("por defecto arranca en tipo fuerza (EMOM), con sus campos de timer", () => {
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    expect(screen.getByLabelText(/duración total/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intervalo por tarea/i)).toBeInTheDocument();
  });

  it("agrega un ejercicio del pool con el selector rápido, con su campo de reps", async () => {
    const user = userEvent.setup();
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Goblet squats" }));

    const row = screen.getByText("Goblet squats").closest("li")!;
    expect(within(row).getByLabelText(/reps/i)).toBeInTheDocument();
  });

  it("cambiar el tipo a intervalos muestra work/rest/rounds y no pide reps por ejercicio", async () => {
    const user = userEvent.setup();
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.selectOptions(screen.getByLabelText(/tipo de bloque/i), "intervalos");

    expect(screen.getByLabelText(/tiempo de trabajo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiempo de descanso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cantidad de rondas/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Burpees" }));

    const row = screen.getByText("Burpees").closest("li")!;
    expect(within(row).queryByLabelText(/reps/i)).not.toBeInTheDocument();
  });

  it("valida que haya al menos un ejercicio antes de enviar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.type(screen.getByLabelText(/nombre del bloque/i), "Fuerza EMOM 12'");
    await user.click(screen.getByRole("button", { name: "Crear bloque" }));

    expect(await screen.findByText(/agregá al menos un ejercicio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía un bloque completo y válido", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.type(screen.getByLabelText(/nombre del bloque/i), "Fuerza EMOM 12'");
    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Goblet squats" }));

    const repsInput = screen.getByLabelText(/reps/i);
    await user.clear(repsInput);
    await user.type(repsInput, "12");

    await user.click(screen.getByRole("button", { name: "Crear bloque" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Fuerza EMOM 12'",
        type: "fuerza",
        exercises: [{ exerciseId: "ex-1", reps: 12 }],
      }),
    );
  });

  it("quitar un ejercicio lo saca de la lista", async () => {
    const user = userEvent.setup();
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Goblet squats" }));
    expect(screen.getByText("Goblet squats")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /quitar goblet squats/i }));
    expect(screen.queryByText("Goblet squats")).not.toBeInTheDocument();
  });

  it("reordena ejercicios con las flechas", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <BlockForm
        poolExercises={poolExercises}
        onCreateExercise={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        submitLabel="Crear bloque"
      />,
    );

    await user.type(screen.getByLabelText(/nombre del bloque/i), "Bloque");
    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Goblet squats" }));
    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(screen.getByRole("button", { name: "Burpees" }));

    await user.click(screen.getByRole("button", { name: /mover goblet squats hacia abajo/i }));

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Burpees")).toBeInTheDocument();
    expect(within(items[1]).getByText("Goblet squats")).toBeInTheDocument();
  });
});
