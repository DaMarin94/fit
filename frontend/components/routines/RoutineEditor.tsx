"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuickSelector } from "@/components/pool/QuickSelector";
import { BlockForm, type BlockFormInitialValues } from "@/components/pool/BlockForm";
import { listExercises } from "@/lib/api/exercises";
import { listBlocks } from "@/lib/api/blocks";
import { ApiError } from "@/lib/http/api-client";
import { routineFormSchema, type RoutineFormValues } from "@/lib/validation/schemas";
import type { Block, Exercise, Routine } from "@/types/domain";

/**
 * Editor de rutina (`docs/screens.md` §3, RF-004 a RF-006). Un único
 * componente para crear y editar: la persistencia (POST vs. PUT) la
 * decide la página contenedora vía `onSave`.
 *
 * Los bloques "ad-hoc" y la edición de la copia de un bloque del día se
 * resuelven con un overlay de pantalla completa que reutiliza
 * `BlockForm` (`docs/screens.md` §8: pantalla propia, no modal de acción
 * rápida) — no hay ruta propia porque el bloque ad-hoc no tiene entidad
 * persistida hasta que se guarda la rutina entera.
 */

type DraftBlockValues = BlockFormInitialValues;
type DraftBlock = { key: string; values: DraftBlockValues };
type DraftDay = { key: string; blocks: DraftBlock[] };

let keyCounter = 0;
function makeKey(): string {
  keyCounter += 1;
  return `k${keyCounter}`;
}

function blockToDraftValues(block: { name: string; type: Block["type"]; advanceMode: Block["advanceMode"]; timerConfig: Block["timerConfig"]; exercises: { exerciseId: string; order: number; reps: number | null; duration: number | null }[] }): DraftBlockValues {
  return {
    name: block.name,
    type: block.type,
    advanceMode: block.advanceMode,
    timerConfig: block.timerConfig as Record<string, number>,
    exercises: block.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((e) => ({ exerciseId: e.exerciseId, reps: e.reps, duration: e.duration })),
  };
}

function buildInitialDays(routine?: Routine): DraftDay[] {
  if (!routine || routine.days.length === 0) {
    return [{ key: makeKey(), blocks: [] }];
  }
  return routine.days
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((day) => ({
      key: makeKey(),
      blocks: day.blocks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((b) => ({ key: makeKey(), values: blockToDraftValues(b) })),
    }));
}

function serialize(name: string, days: DraftDay[]): string {
  return JSON.stringify({ name, days: days.map((d) => d.blocks.map((b) => b.values)) });
}

const TYPE_LABEL: Record<Block["type"], string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos",
  cardio_libre: "Libre (cardio)",
};

export type RoutineEditorProps = {
  initialRoutine?: Routine;
  onSave: (values: RoutineFormValues) => Promise<void>;
};

export function RoutineEditor({ initialRoutine, onSave }: RoutineEditorProps) {
  const router = useRouter();

  const [name, setName] = useState(initialRoutine?.name ?? "");
  const [days, setDays] = useState<DraftDay[]>(() => buildInitialDays(initialRoutine));
  const initialSnapshot = useMemo(
    () => serialize(initialRoutine?.name ?? "", buildInitialDays(initialRoutine)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [poolExercises, setPoolExercises] = useState<Exercise[] | null>(null);
  const [poolBlocks, setPoolBlocks] = useState<Block[] | null>(null);

  useEffect(() => {
    listExercises()
      .then(setPoolExercises)
      .catch(() => setPoolExercises([]));
    listBlocks()
      .then(setPoolBlocks)
      .catch(() => setPoolBlocks([]));
  }, []);

  const [blockSelectorForDay, setBlockSelectorForDay] = useState<string | null>(null);
  const [blockEditor, setBlockEditor] = useState<{ dayKey: string; blockKey: string | null } | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  function updateDay(dayKey: string, updater: (day: DraftDay) => DraftDay) {
    setDays((prev) => prev.map((d) => (d.key === dayKey ? updater(d) : d)));
  }

  function addDay() {
    setDays((prev) => [...prev, { key: makeKey(), blocks: [] }]);
  }

  function removeDay(dayKey: string) {
    setDays((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== dayKey)));
  }

  function moveDay(index: number, direction: -1 | 1) {
    setDays((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addPoolBlockToDay(dayKey: string, blockId: string) {
    const block = poolBlocks?.find((b) => b.id === blockId);
    if (!block) return;
    updateDay(dayKey, (day) => ({
      ...day,
      blocks: [...day.blocks, { key: makeKey(), values: blockToDraftValues(block) }],
    }));
    setBlockSelectorForDay(null);
  }

  function removeBlock(dayKey: string, blockKey: string) {
    updateDay(dayKey, (day) => ({ ...day, blocks: day.blocks.filter((b) => b.key !== blockKey) }));
  }

  function moveBlock(dayKey: string, index: number, direction: -1 | 1) {
    updateDay(dayKey, (day) => {
      const target = index + direction;
      if (target < 0 || target >= day.blocks.length) return day;
      const blocks = [...day.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...day, blocks };
    });
  }

  function saveBlockFromEditor(values: DraftBlockValues) {
    if (!blockEditor) return;
    const { dayKey, blockKey } = blockEditor;
    updateDay(dayKey, (day) => {
      if (blockKey === null) {
        return { ...day, blocks: [...day.blocks, { key: makeKey(), values }] };
      }
      return { ...day, blocks: day.blocks.map((b) => (b.key === blockKey ? { ...b, values } : b)) };
    });
    setBlockEditor(null);
  }

  function isDirty(): boolean {
    return serialize(name, days) !== initialSnapshot;
  }

  function handleDiscard() {
    if (isDirty()) {
      setDiscardConfirmOpen(true);
    } else {
      router.push("/");
    }
  }

  async function handleSave() {
    setNameError(null);
    setFormError(null);

    const candidate = { name, days: days.map((d) => ({ blocks: d.blocks.map((b) => b.values) })) };
    const result = routineFormSchema.safeParse(candidate);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Revisá los datos de la rutina.");
      return;
    }

    setSaving(true);
    try {
      await onSave(result.data);
    } catch (err) {
      if (err instanceof ApiError && err.code === "NAME_TAKEN") {
        setNameError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const editingBlockValues: DraftBlockValues | undefined =
    blockEditor && blockEditor.blockKey
      ? days.find((d) => d.key === blockEditor.dayKey)?.blocks.find((b) => b.key === blockEditor.blockKey)?.values
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      {formError ? (
        <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="routine-name" className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Nombre de la rutina
        </label>
        <input
          id="routine-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: nameError ? "var(--danger)" : "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        />
        {nameError ? (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        {days.map((day, dayIndex) => (
          <div key={day.key} className="flex flex-col gap-3 rounded-[var(--r-lg)] border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {`Día ${dayIndex + 1}`}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Mover día ${dayIndex + 1} hacia arriba`}
                  onClick={() => moveDay(dayIndex, -1)}
                  disabled={dayIndex === 0}
                  className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Mover día ${dayIndex + 1} hacia abajo`}
                  onClick={() => moveDay(dayIndex, 1)}
                  disabled={dayIndex === days.length - 1}
                  className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Borrar día ${dayIndex + 1}`}
                  onClick={() => removeDay(day.key)}
                  disabled={days.length <= 1}
                  className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
                  style={{ color: "var(--danger)" }}
                >
                  ×
                </button>
              </div>
            </div>

            {day.blocks.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Este día todavía no tiene bloques.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {day.blocks.map((block, blockIndex) => (
                  <li
                    key={block.key}
                    className="flex items-center justify-between gap-2 rounded-[var(--r-md)] border px-3 py-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {block.values.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {TYPE_LABEL[block.values.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Mover ${block.values.name} hacia arriba`}
                        onClick={() => moveBlock(day.key, blockIndex, -1)}
                        disabled={blockIndex === 0}
                        className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Mover ${block.values.name} hacia abajo`}
                        onClick={() => moveBlock(day.key, blockIndex, 1)}
                        disabled={blockIndex === day.blocks.length - 1}
                        className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Editar ${block.values.name}`}
                        onClick={() => setBlockEditor({ dayKey: day.key, blockKey: block.key })}
                        className="flex h-9 items-center px-2 text-xs font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        aria-label={`Quitar ${block.values.name}`}
                        onClick={() => removeBlock(day.key, block.key)}
                        className="flex h-9 w-9 items-center justify-center"
                        style={{ color: "var(--danger)" }}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setBlockSelectorForDay(day.key)}>
                Agregar bloque del pool
              </Button>
              <Button variant="secondary" onClick={() => setBlockEditor({ dayKey: day.key, blockKey: null })}>
                Crear bloque ad-hoc
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button variant="secondary" onClick={addDay}>
          Agregar día
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="subtle" onClick={handleDiscard}>
          Descartar
        </Button>
        <Button onClick={handleSave} loading={saving}>
          Guardar
        </Button>
      </div>

      <QuickSelector
        open={blockSelectorForDay !== null}
        title="Elegí un bloque"
        items={poolBlocks === null ? null : poolBlocks.map((b) => ({ id: b.id, name: b.name }))}
        onSelect={(id) => blockSelectorForDay && addPoolBlockToDay(blockSelectorForDay, id)}
        onClose={() => setBlockSelectorForDay(null)}
        emptyActionLabel="Crear bloque"
        onEmptyAction={() => router.push("/pool/bloques/nuevo")}
      />

      {blockEditor ? (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto p-4" style={{ background: "var(--bg)" }}>
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {blockEditor.blockKey ? "Editar bloque" : "Nuevo bloque"}
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setBlockEditor(null)}
                className="flex h-11 w-11 items-center justify-center"
              >
                ×
              </button>
            </div>
            <BlockForm
              initialValues={editingBlockValues}
              poolExercises={poolExercises}
              onCreateExercise={() => router.push("/pool/ejercicios/nuevo")}
              submitLabel={blockEditor.blockKey ? "Guardar cambios" : "Agregar bloque"}
              onCancel={() => setBlockEditor(null)}
              onSubmit={saveBlockFromEditor}
            />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={discardConfirmOpen}
        title="¿Descartar los cambios?"
        description="Vas a perder los cambios sin guardar en esta rutina."
        confirmLabel="Descartar cambios"
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          router.push("/");
        }}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </div>
  );
}
