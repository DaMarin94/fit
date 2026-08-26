"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/http/api-client";
import { equipmentNameSchema } from "@/lib/validation/schemas";

/**
 * Edición de elemento de equipamiento (`docs/screens.md` §4, RF-016).
 * Formulario mínimo, solo nombre — análogo al `ExerciseForm` previo a la
 * sección de equipo (Fase 2).
 */
export type EquipmentFormProps = {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void> | void;
  onCancel: () => void;
};

export function EquipmentForm({ initialName = "", submitLabel, onSubmit, onCancel }: EquipmentFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = equipmentNameSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisá el nombre.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(result.data.name);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="equipment-name" className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Nombre
        </label>
        <input
          id="equipment-name"
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
