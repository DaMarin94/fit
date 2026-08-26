"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { QuickSelector } from "@/components/pool/QuickSelector";
import { blockFormSchema, type BlockFormValues } from "@/lib/validation/schemas";
import type { AdvanceMode, BlockType, Exercise } from "@/types/domain";

type Row = { exerciseId: string; reps: string; duration: string };

export type BlockFormInitialValues = {
  name: string;
  type: BlockType;
  advanceMode: AdvanceMode;
  timerConfig: Record<string, number>;
  exercises: { exerciseId: string; reps?: number | null; duration?: number | null }[];
};

export type BlockFormProps = {
  initialValues?: BlockFormInitialValues;
  poolExercises: Exercise[] | null;
  onCreateExercise: () => void;
  onSubmit: (values: BlockFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
};

const DEFAULT_TIMER_CONFIG: Record<BlockType, Record<string, number>> = {
  fuerza: { totalDurationSeconds: 600, taskIntervalSeconds: 60 },
  metcon: { totalDurationSeconds: 600 },
  intervalos: { workSeconds: 30, restSeconds: 15, rounds: 2 },
  cardio_libre: {},
};

const TYPE_LABELS: Record<BlockType, string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos (work/rest)",
  cardio_libre: "Libre (cardio)",
};

function usesReps(type: BlockType): boolean {
  return type === "fuerza" || type === "metcon";
}
function usesDuration(type: BlockType): boolean {
  return type === "cardio_libre";
}

/**
 * Edición de bloque (`docs/screens.md` §4, RF-002/RF-003). Reutilizable
 * tanto para el pool como para el bloque ad-hoc de un día en el Editor de
 * rutina: no persiste nada por su cuenta, solo arma el `BlockFormValues`
 * validado y lo entrega a `onSubmit`.
 */
export function BlockForm({
  initialValues,
  poolExercises,
  onCreateExercise,
  onSubmit,
  onCancel,
  submitLabel,
}: BlockFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<BlockType>(initialValues?.type ?? "fuerza");
  const [advanceMode, setAdvanceMode] = useState<AdvanceMode>(initialValues?.advanceMode ?? "manual");
  const [timerConfig, setTimerConfig] = useState<Record<string, number>>(
    initialValues?.timerConfig ?? DEFAULT_TIMER_CONFIG.fuerza,
  );
  const [rows, setRows] = useState<Row[]>(
    (initialValues?.exercises ?? []).map((e) => ({
      exerciseId: e.exerciseId,
      reps: e.reps != null ? String(e.reps) : "",
      duration: e.duration != null ? String(e.duration) : "",
    })),
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of poolExercises ?? []) map.set(ex.id, ex.name);
    return map;
  }, [poolExercises]);

  const selectableExercises = useMemo(
    () => (poolExercises ?? []).filter((ex) => !rows.some((r) => r.exerciseId === ex.id)),
    [poolExercises, rows],
  );

  function handleTypeChange(nextType: BlockType) {
    setType(nextType);
    setTimerConfig(DEFAULT_TIMER_CONFIG[nextType]);
  }

  function updateTimerField(key: string, value: string) {
    setTimerConfig((prev) => ({ ...prev, [key]: value === "" ? NaN : Number(value) }));
  }

  function addExercise(exerciseId: string) {
    setRows((prev) => [...prev, { exerciseId, reps: "", duration: "" }]);
    setSelectorOpen(false);
  }

  function removeExercise(exerciseId: string) {
    setRows((prev) => prev.filter((r) => r.exerciseId !== exerciseId));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateRowField(exerciseId: string, field: "reps" | "duration", value: string) {
    setRows((prev) => prev.map((r) => (r.exerciseId === exerciseId ? { ...r, [field]: value } : r)));
  }

  function buildCandidate() {
    const exercises = rows.map((r) => {
      if (usesReps(type)) {
        return { exerciseId: r.exerciseId, reps: r.reps === "" ? NaN : Number(r.reps) };
      }
      if (usesDuration(type)) {
        return { exerciseId: r.exerciseId, duration: r.duration === "" ? NaN : Number(r.duration) };
      }
      return { exerciseId: r.exerciseId };
    });

    return { name, type, advanceMode, timerConfig, exercises };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const candidate = buildCandidate();
    const result = blockFormSchema.safeParse(candidate);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisá los datos del bloque.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch {
      // El toast de error ya lo dispara la capa HTTP (docs/technical.md §2.2).
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}

      <Field label="Nombre del bloque" htmlFor="block-name">
        <input
          id="block-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        />
      </Field>

      <Field label="Tipo de bloque" htmlFor="block-type">
        <select
          id="block-type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as BlockType)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        >
          {(Object.keys(TYPE_LABELS) as BlockType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <TimerConfigFields type={type} timerConfig={timerConfig} onChange={updateTimerField} />

      <Field label="Avance al siguiente bloque" htmlFor="block-advance-mode">
        <select
          id="block-advance-mode"
          value={advanceMode}
          onChange={(e) => setAdvanceMode(e.target.value as AdvanceMode)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        >
          <option value="manual">Manual (confirmo para seguir)</option>
          <option value="automatico">Automático (arranca solo)</option>
        </select>
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Ejercicios
        </span>
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li
              key={row.exerciseId}
              className="flex items-center gap-2 rounded-[var(--r-md)] border px-3 py-2"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>
                {exerciseNameById.get(row.exerciseId) ?? row.exerciseId}
              </span>

              {usesReps(type) ? (
                <label className="flex items-center gap-1 text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Reps</span>
                  <input
                    aria-label={`Reps de ${exerciseNameById.get(row.exerciseId) ?? row.exerciseId}`}
                    type="number"
                    min={1}
                    value={row.reps}
                    onChange={(e) => updateRowField(row.exerciseId, "reps", e.target.value)}
                    className="h-9 w-16 rounded-[var(--r-sm)] border px-2 text-sm"
                    style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </label>
              ) : null}

              {usesDuration(type) ? (
                <label className="flex items-center gap-1 text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Duración (s)</span>
                  <input
                    aria-label={`Duración de ${exerciseNameById.get(row.exerciseId) ?? row.exerciseId}`}
                    type="number"
                    min={1}
                    value={row.duration}
                    onChange={(e) => updateRowField(row.exerciseId, "duration", e.target.value)}
                    className="h-9 w-20 rounded-[var(--r-sm)] border px-2 text-sm"
                    style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </label>
              ) : null}

              <button
                type="button"
                aria-label={`Mover ${exerciseNameById.get(row.exerciseId) ?? row.exerciseId} hacia arriba`}
                onClick={() => moveExercise(index, -1)}
                disabled={index === 0}
                className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Mover ${exerciseNameById.get(row.exerciseId) ?? row.exerciseId} hacia abajo`}
                onClick={() => moveExercise(index, 1)}
                disabled={index === rows.length - 1}
                className="flex h-9 w-9 items-center justify-center disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Quitar ${exerciseNameById.get(row.exerciseId) ?? row.exerciseId}`}
                onClick={() => removeExercise(row.exerciseId)}
                className="flex h-9 w-9 items-center justify-center"
                style={{ color: "var(--danger)" }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div>
          <Button type="button" variant="secondary" onClick={() => setSelectorOpen(true)}>
            Agregar ejercicio
          </Button>
        </div>
      </div>

      <QuickSelector
        open={selectorOpen}
        title="Elegí un ejercicio"
        items={poolExercises === null ? null : selectableExercises.map((e) => ({ id: e.id, name: e.name }))}
        onSelect={addExercise}
        onClose={() => setSelectorOpen(false)}
        emptyActionLabel="Crear ejercicio"
        onEmptyAction={onCreateExercise}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="subtle" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TimerConfigFields({
  type,
  timerConfig,
  onChange,
}: {
  type: BlockType;
  timerConfig: Record<string, number>;
  onChange: (key: string, value: string) => void;
}) {
  function numberField(id: string, label: string, key: string) {
    return (
      <Field key={key} label={label} htmlFor={id}>
        <input
          id={id}
          type="number"
          min={1}
          value={Number.isNaN(timerConfig[key]) ? "" : timerConfig[key]}
          onChange={(e) => onChange(key, e.target.value)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        />
      </Field>
    );
  }

  if (type === "fuerza") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {numberField("timer-total-duration", "Duración total (segundos)", "totalDurationSeconds")}
        {numberField("timer-task-interval", "Intervalo por tarea (segundos)", "taskIntervalSeconds")}
      </div>
    );
  }

  if (type === "metcon") {
    return <div className="grid grid-cols-2 gap-3">{numberField("timer-total-duration", "Duración total (segundos)", "totalDurationSeconds")}</div>;
  }

  if (type === "intervalos") {
    return (
      <div className="grid grid-cols-3 gap-3">
        {numberField("timer-work", "Tiempo de trabajo (segundos)", "workSeconds")}
        {numberField("timer-rest", "Tiempo de descanso (segundos)", "restSeconds")}
        {numberField("timer-rounds", "Cantidad de rondas", "rounds")}
      </div>
    );
  }

  return null;
}
