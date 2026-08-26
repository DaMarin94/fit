"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { QuickSelector } from "@/components/pool/QuickSelector";
import { ApiError } from "@/lib/http/api-client";
import { exerciseNameSchema } from "@/lib/validation/schemas";
import type { Equipment, EquipmentGroups } from "@/types/domain";

/**
 * Edición de ejercicio (`docs/screens.md` §4, RF-001/RF-017). Nombre y sus
 * grupos de equipo, cero o más: dentro de un grupo la relación es "O"
 * (alternativas), entre grupos es "Y" (todos hacen falta). Forma visual en
 * `docs/design.md` §11 — un grupo es siempre una caja, aunque tenga un solo
 * elemento; el grupo vacío no existe como estado persistente (RN-014): se
 * cumple por construcción porque "Agregar equipo" abre el selector rápido
 * de una y el grupo nace con su primer elemento.
 */

/** Selector abierto para crear un grupo nuevo, o para sumar una alternativa a uno existente. */
type SelectorState = { mode: "group" } | { mode: "alternative"; groupIndex: number } | null;

export type ExerciseFormProps = {
  initialName?: string;
  initialEquipmentGroups?: EquipmentGroups;
  poolEquipment: Equipment[] | null;
  onCreateEquipment: () => void;
  submitLabel: string;
  onSubmit: (values: { name: string; equipmentGroups: EquipmentGroups }) => Promise<void> | void;
  onCancel: () => void;
};

export function ExerciseForm({
  initialName = "",
  initialEquipmentGroups = [],
  poolEquipment,
  onCreateEquipment,
  submitLabel,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(initialName);
  const [groups, setGroups] = useState<EquipmentGroups>(initialEquipmentGroups);
  const [selector, setSelector] = useState<SelectorState>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const equipmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const eq of poolEquipment ?? []) map.set(eq.id, eq.name);
    return map;
  }, [poolEquipment]);

  function openGroupSelector() {
    setSelector({ mode: "group" });
  }

  function openAlternativeSelector(groupIndex: number) {
    setSelector({ mode: "alternative", groupIndex });
  }

  function closeSelector() {
    setSelector(null);
  }

  function handleSelectEquipment(equipmentId: string) {
    if (selector?.mode === "group") {
      setGroups((prev) => [...prev, [equipmentId]]);
    } else if (selector?.mode === "alternative") {
      const groupIndex = selector.groupIndex;
      setGroups((prev) => prev.map((group, i) => (i === groupIndex ? [...group, equipmentId] : group)));
    }
    setSelector(null);
  }

  function removeItem(groupIndex: number, itemIndex: number) {
    setGroups((prev) => {
      const next: EquipmentGroups = [];
      for (let i = 0; i < prev.length; i++) {
        if (i !== groupIndex) {
          next.push(prev[i]);
          continue;
        }
        const remaining = prev[i].filter((_, j) => j !== itemIndex);
        if (remaining.length > 0) {
          next.push(remaining);
        }
        // Si no queda ningún elemento, el grupo entero desaparece con él
        // (docs/design.md §11.6): no hay botón "quitar grupo" separado.
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = exerciseNameSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisá el nombre.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: result.data.name, equipmentGroups: groups });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasGroups = groups.length > 0;
  const selectorItems =
    poolEquipment === null ? null : poolEquipment.map((eq) => ({ id: eq.id, name: eq.name }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="exercise-name" className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Nombre
        </label>
        <input
          id="exercise-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-[var(--r-md)] border px-3 text-sm"
          style={{ borderColor: error ? "var(--danger)" : "var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
          aria-invalid={error ? true : undefined}
        />
        {error ? (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold leading-6" style={{ color: "var(--text)" }}>
            Equipo
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cada equipo que agregues es algo que el ejercicio necesita. Si se puede reemplazar, agregale
            alternativas: con cualquiera alcanza.
          </p>
        </div>

        {!hasGroups ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sin equipo. Se hace con el peso del cuerpo.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col">
                {groupIndex > 0 ? <EquipmentGroupConnector /> : null}
                <div
                  className="rounded-[var(--r-md)] border p-2"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  {group.map((equipmentId, itemIndex) => {
                    const equipmentName = equipmentNameById.get(equipmentId) ?? equipmentId;
                    return (
                      <div key={`${equipmentId}-${itemIndex}`}>
                        {itemIndex > 0 ? (
                          <div className="flex h-5 items-center pl-3">
                            <span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
                              o
                            </span>
                          </div>
                        ) : null}
                        <div
                          className="flex min-h-11 items-center rounded-[var(--r-sm)]"
                          style={{ background: "var(--surface-2)" }}
                        >
                          <span
                            className="flex-1 pl-3 text-base"
                            style={{ color: "var(--text)", overflowWrap: "anywhere" }}
                          >
                            {equipmentName}
                          </span>
                          <button
                            type="button"
                            aria-label={`Quitar ${equipmentName}`}
                            onClick={() => removeItem(groupIndex, itemIndex)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-sm)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ color: "var(--text-muted)", outlineColor: "var(--accent)" }}
                          >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => openAlternativeSelector(groupIndex)}
                    className="mt-1 flex h-11 w-full items-center gap-1 rounded-[var(--r-sm)] pl-3 text-[13px] font-semibold hover:bg-[var(--accent-tint)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ color: "var(--text-muted)", outlineColor: "var(--accent)" }}
                  >
                    <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    Agregar alternativa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selector?.mode === "group" ? (
          <div
            className="flex h-[60px] items-center justify-center rounded-[var(--r-md)] border text-center"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
              Elegí el primer elemento
            </span>
          </div>
        ) : null}

        <Button type="button" variant="secondary" fullWidth onClick={openGroupSelector}>
          <PlusIcon className="h-5 w-5" aria-hidden="true" style={{ color: "var(--text-muted)" }} />
          {hasGroups ? "Agregar otro equipo" : "Agregar equipo"}
        </Button>
      </div>

      <QuickSelector
        open={selector !== null}
        title={selector?.mode === "alternative" ? "Agregar alternativa" : "Agregar equipo"}
        items={selectorItems}
        onSelect={handleSelectEquipment}
        onClose={closeSelector}
        emptyActionLabel="Crear elemento"
        onEmptyAction={onCreateEquipment}
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

/** Conector "Y" entre tarjetas de grupo (`docs/design.md` §11.3/§11.6). */
function EquipmentGroupConnector() {
  return (
    <div className="flex h-5 items-center gap-2 py-1 pl-3">
      <span
        className="text-xs font-bold uppercase"
        style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
      >
        Y
      </span>
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}
