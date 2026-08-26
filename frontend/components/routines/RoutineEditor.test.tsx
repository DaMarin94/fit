import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoutineEditor } from "./RoutineEditor";
import * as exercisesApi from "@/lib/api/exercises";
import * as blocksApi from "@/lib/api/blocks";
import { ApiError } from "@/lib/http/api-client";
import type { Routine } from "@/types/domain";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const poolExercises = [{ id: "ex-1", name: "Goblet squats", equipmentGroups: [], deletedAt: null }];
const poolBlocks = [
  {
    id: "pb-1",
    name: "Fuerza EMOM 12'",
    type: "fuerza" as const,
    timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
    advanceMode: "manual" as const,
    exercises: [{ id: "be-1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
    deletedAt: null,
  },
];

function setupPool() {
  vi.spyOn(exercisesApi, "listExercises").mockResolvedValue(poolExercises);
  vi.spyOn(blocksApi, "listBlocks").mockResolvedValue(poolBlocks);
}

describe("RoutineEditor — rutina nueva", () => {
  it("arranca con un día vacío y CTA para agregar el primer bloque", async () => {
    setupPool();
    render(<RoutineEditor onSave={vi.fn()} />);

    expect(await screen.findByText(/día 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar bloque del pool/i })).toBeInTheDocument();
  });

  it("agregar un bloque del pool lo copia al día", async () => {
    const user = userEvent.setup();
    setupPool();
    render(<RoutineEditor onSave={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /agregar bloque del pool/i }));
    await user.click(await screen.findByRole("button", { name: "Fuerza EMOM 12'" }));

    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
  });

  it("crear un bloque ad-hoc lo agrega al día sin tocar el pool", async () => {
    const user = userEvent.setup();
    setupPool();
    const createBlockSpy = vi.spyOn(blocksApi, "createBlock");
    render(<RoutineEditor onSave={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /crear bloque ad-hoc/i }));
    await user.type(screen.getByLabelText(/nombre del bloque/i), "Bloque especial");
    await user.click(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await user.click(await screen.findByRole("button", { name: "Goblet squats" }));
    const repsInput = screen.getByLabelText(/reps/i);
    await user.clear(repsInput);
    await user.type(repsInput, "10");
    await user.click(screen.getByRole("button", { name: /agregar bloque$/i }));

    expect(screen.getByText("Bloque especial")).toBeInTheDocument();
    expect(createBlockSpy).not.toHaveBeenCalled();
  });

  it("agregar un segundo día", async () => {
    const user = userEvent.setup();
    setupPool();
    render(<RoutineEditor onSave={vi.fn()} />);

    await screen.findByText(/día 1/i);
    await user.click(screen.getByRole("button", { name: /agregar día/i }));

    expect(screen.getByText(/día 2/i)).toBeInTheDocument();
  });

  it("guardar envía el nombre y el árbol completo de días y bloques", async () => {
    const user = userEvent.setup();
    setupPool();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RoutineEditor onSave={onSave} />);

    await user.type(screen.getByLabelText(/nombre de la rutina/i), "Plan semanal");
    await user.click(await screen.findByRole("button", { name: /agregar bloque del pool/i }));
    await user.click(await screen.findByRole("button", { name: "Fuerza EMOM 12'" }));
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(onSave).toHaveBeenCalledWith({
      name: "Plan semanal",
      days: [
        {
          blocks: [
            {
              name: "Fuerza EMOM 12'",
              type: "fuerza",
              advanceMode: "manual",
              timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
              exercises: [{ exerciseId: "ex-1", reps: 12 }],
            },
          ],
        },
      ],
    });
  });

  it("si el backend responde NAME_TAKEN, lo muestra junto al nombre", async () => {
    const user = userEvent.setup();
    setupPool();
    const onSave = vi.fn().mockRejectedValue(new ApiError("Ya existe una rutina con ese nombre.", "NAME_TAKEN"));
    render(<RoutineEditor onSave={onSave} />);

    await user.type(screen.getByLabelText(/nombre de la rutina/i), "Plan semanal");
    await user.click(await screen.findByRole("button", { name: /agregar bloque del pool/i }));
    await user.click(await screen.findByRole("button", { name: "Fuerza EMOM 12'" }));
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(await screen.findByText("Ya existe una rutina con ese nombre.")).toBeInTheDocument();
  });

  it("descartar sin cambios vuelve directo, sin confirmar", async () => {
    const user = userEvent.setup();
    setupPool();
    render(<RoutineEditor onSave={vi.fn()} />);

    await screen.findByText(/día 1/i);
    await user.click(screen.getByRole("button", { name: /descartar/i }));

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("descartar con cambios sin guardar pide confirmación", async () => {
    const user = userEvent.setup();
    setupPool();
    render(<RoutineEditor onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/nombre de la rutina/i), "Algo");
    await user.click(screen.getByRole("button", { name: /descartar/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});

describe("RoutineEditor — rutina existente", () => {
  const existing: Routine = {
    id: "r1",
    name: "Plan semanal",
    deletedAt: null,
    days: [
      {
        id: "d1",
        order: 0,
        blocks: [
          {
            id: "db1",
            order: 0,
            name: "Fuerza EMOM 12'",
            type: "fuerza",
            timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
            advanceMode: "manual",
            exercises: [{ id: "be1", exerciseId: "ex-1", order: 0, reps: 12, duration: null }],
          },
        ],
      },
    ],
  };

  it("precarga nombre, días y bloques existentes", async () => {
    setupPool();
    render(<RoutineEditor initialRoutine={existing} onSave={vi.fn()} />);

    expect(await screen.findByDisplayValue("Plan semanal")).toBeInTheDocument();
    expect(screen.getByText("Fuerza EMOM 12'")).toBeInTheDocument();
  });

  it("quitar un bloque del día lo saca de la lista", async () => {
    const user = userEvent.setup();
    setupPool();
    render(<RoutineEditor initialRoutine={existing} onSave={vi.fn()} />);

    await screen.findByText("Fuerza EMOM 12'");
    await user.click(screen.getByRole("button", { name: /quitar fuerza emom 12'/i }));

    expect(screen.queryByText("Fuerza EMOM 12'")).not.toBeInTheDocument();
  });
});
