"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  CubeIcon,
  ListBulletIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuickSelector } from "@/components/pool/QuickSelector";
import { deleteExercise, listExercises } from "@/lib/api/exercises";
import { deleteBlock, listBlocks } from "@/lib/api/blocks";
import { deleteEquipment, listEquipment } from "@/lib/api/equipment";
import type {
  Block,
  Equipment,
  EquipmentGroups,
  Exercise,
  FuerzaTimerConfig,
  IntervalosTimerConfig,
  MetconTimerConfig,
} from "@/types/domain";

/**
 * Pool de bloques, ejercicios y elementos (`docs/screens.md` §4). Tres
 * secciones apiladas en el orden Ejercicios -> Bloques -> Elementos
 * (`docs/design.md` §11.4). El listado de ejercicios muestra su equipo
 * (RF-017, dos niveles Y/O — `docs/design.md` §11) y se puede filtrar por
 * elemento (RF-018).
 */

type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

const TYPE_LABEL: Record<Block["type"], string> = {
  fuerza: "Fuerza (EMOM)",
  metcon: "Metcon (AMRAP)",
  intervalos: "Intervalos",
  cardio_libre: "Libre (cardio)",
};

/** ID sintético para la opción "sin filtro" dentro del selector de filtro. */
const FILTER_ALL_ID = "__all__";
/** Valor que espera la API para "no necesita ningún equipo" (RF-018). */
const FILTER_NONE_ID = "none";

function blockSummary(block: Block): string {
  switch (block.type) {
    case "fuerza": {
      const config = block.timerConfig as FuerzaTimerConfig;
      return `${TYPE_LABEL.fuerza} · ${config.totalDurationSeconds}s totales, tarea cada ${config.taskIntervalSeconds}s`;
    }
    case "metcon": {
      const config = block.timerConfig as MetconTimerConfig;
      return `${TYPE_LABEL.metcon} · ${config.totalDurationSeconds}s`;
    }
    case "intervalos": {
      const config = block.timerConfig as IntervalosTimerConfig;
      return `${TYPE_LABEL.intervalos} · ${config.workSeconds}s trabajo / ${config.restSeconds}s descanso · ${config.rounds} rondas`;
    }
    case "cardio_libre":
      return `${TYPE_LABEL.cardio_libre} · ${block.exercises.length} fases`;
  }
}

/** Línea de equipo del renglón de ejercicio (`docs/design.md` §11.2-§11.5). */
function EquipmentLine({
  groups,
  equipmentNameById,
}: {
  groups: EquipmentGroups;
  equipmentNameById: Map<string, string>;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        <span className="sr-only">Equipo: </span>
        Sin equipo
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="sr-only">Equipo: </span>
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="inline-flex items-center gap-1.5">
          {groupIndex > 0 ? (
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
            >
              Y
            </span>
          ) : null}
          <span
            className="inline-flex min-h-6 items-center rounded-[var(--r-sm)] border px-2 py-0.5 text-[13px] font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
          >
            {group.map((equipmentId, itemIndex) => (
              <span key={`${equipmentId}-${itemIndex}`} style={{ overflowWrap: "anywhere" }}>
                {itemIndex > 0 ? (
                  <span className="mx-1" style={{ color: "var(--text-muted)" }}>
                    o
                  </span>
                ) : null}
                {equipmentNameById.get(equipmentId) ?? equipmentId}
              </span>
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function PoolPage() {
  const [exercises, setExercises] = useState<Loadable<Exercise[]>>({ status: "loading" });
  const [blocks, setBlocks] = useState<Loadable<Block[]>>({ status: "loading" });
  const [equipment, setEquipment] = useState<Loadable<Equipment[]>>({ status: "loading" });
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [filterSelectorOpen, setFilterSelectorOpen] = useState(false);

  const fetchExercises = useCallback(() => {
    const request = filter ? listExercises({ equipmentId: filter }) : listExercises();
    request
      .then((data) => setExercises({ status: "ready", data }))
      .catch(() => setExercises({ status: "error" }));
  }, [filter]);

  const loadExercises = useCallback(() => {
    setExercises({ status: "loading" });
    fetchExercises();
  }, [fetchExercises]);

  const fetchBlocks = useCallback(() => {
    listBlocks()
      .then((data) => setBlocks({ status: "ready", data }))
      .catch(() => setBlocks({ status: "error" }));
  }, []);

  const loadBlocks = useCallback(() => {
    setBlocks({ status: "loading" });
    fetchBlocks();
  }, [fetchBlocks]);

  const fetchEquipment = useCallback(() => {
    listEquipment()
      .then((data) => setEquipment({ status: "ready", data }))
      .catch(() => setEquipment({ status: "error" }));
  }, []);

  const loadEquipment = useCallback(() => {
    setEquipment({ status: "loading" });
    fetchEquipment();
  }, [fetchEquipment]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    fetchBlocks();
    fetchEquipment();
  }, [fetchBlocks, fetchEquipment]);

  const equipmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    if (equipment.status === "ready") {
      for (const eq of equipment.data) map.set(eq.id, eq.name);
    }
    return map;
  }, [equipment]);

  const filterLabel =
    filter === null ? "Todos los equipos" : filter === FILTER_NONE_ID ? "Sin equipo" : (equipmentNameById.get(filter) ?? filter);

  const filterSelectorItems =
    equipment.status === "ready"
      ? [
          { id: FILTER_ALL_ID, name: "Todos los equipos" },
          { id: FILTER_NONE_ID, name: "Sin equipo" },
          ...equipment.data.map((eq) => ({ id: eq.id, name: eq.name })),
        ]
      : null;

  function handleSelectFilter(id: string) {
    setFilter(id === FILTER_ALL_ID ? null : id);
    setFilterSelectorOpen(false);
  }

  async function confirmDeleteExercise() {
    if (!exerciseToDelete) return;
    const target = exerciseToDelete;
    setExerciseToDelete(null);
    try {
      await deleteExercise(target.id);
      loadExercises();
    } catch {
      // El toast de error (incluido EXERCISE_IN_USE, RN-007) ya lo dispara api-client.
    }
  }

  async function confirmDeleteBlock() {
    if (!blockToDelete) return;
    const target = blockToDelete;
    setBlockToDelete(null);
    try {
      await deleteBlock(target.id);
      loadBlocks();
    } catch {
      // Idem: toast centralizado.
    }
  }

  async function confirmDeleteEquipment() {
    if (!equipmentToDelete) return;
    const target = equipmentToDelete;
    setEquipmentToDelete(null);
    try {
      await deleteEquipment(target.id);
      loadEquipment();
    } catch {
      // Idem: toast centralizado (incluido EQUIPMENT_IN_USE, RN-013).
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Pool
      </h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Ejercicios
          </h2>
          <Link
            href="/pool/ejercicios/nuevo"
            className="text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            + Nuevo ejercicio
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterSelectorOpen(true)}
            className="flex h-11 items-center gap-1 rounded-[var(--r-md)] px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={
              filter !== null
                ? { background: "var(--accent-tint)", color: "var(--accent)", outlineColor: "var(--accent)" }
                : {
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                    outlineColor: "var(--accent)",
                  }
            }
          >
            {filterLabel}
            {filter === null ? <ChevronDownIcon className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
          {filter !== null ? (
            <button
              type="button"
              aria-label="Quitar filtro de equipo"
              onClick={() => setFilter(null)}
              className="flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "var(--accent)", outlineColor: "var(--accent)" }}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {exercises.status === "loading" ? <ListSkeleton rows={3} /> : null}
        {exercises.status === "error" ? <ErrorState message="No se pudieron cargar los ejercicios." onRetry={loadExercises} /> : null}
        {exercises.status === "ready" && exercises.data.length === 0 && filter === null ? (
          <EmptyState
            icon={ListBulletIcon}
            title="Todavía no hay ejercicios"
            description="Creá tu primer ejercicio para poder usarlo en los bloques."
          />
        ) : null}
        {exercises.status === "ready" && exercises.data.length === 0 && filter === null ? (
          <div className="-mt-2 flex justify-center">
            <Link href="/pool/ejercicios/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Crear ejercicio
            </Link>
          </div>
        ) : null}
        {exercises.status === "ready" && exercises.data.length === 0 && filter !== null ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border px-6 py-8 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No encontramos ejercicios con ese filtro.
            </p>
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="text-sm font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              Limpiar filtro
            </button>
          </div>
        ) : null}
        {exercises.status === "ready" && exercises.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {exercises.data.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-[var(--r-lg)] border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/pool/ejercicios/${exercise.id}/editar`} className="flex flex-col gap-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {exercise.name}
                  </span>
                  <EquipmentLine groups={exercise.equipmentGroups} equipmentNameById={equipmentNameById} />
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${exercise.name}`}
                  onClick={() => setExerciseToDelete(exercise)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Bloques
          </h2>
          <Link href="/pool/bloques/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            + Nuevo bloque
          </Link>
        </div>

        {blocks.status === "loading" ? <ListSkeleton rows={3} /> : null}
        {blocks.status === "error" ? <ErrorState message="No se pudieron cargar los bloques." onRetry={loadBlocks} /> : null}
        {blocks.status === "ready" && blocks.data.length === 0 ? (
          <EmptyState
            icon={ArchiveBoxIcon}
            title="Todavía no hay bloques"
            description="Creá tu primer bloque para poder agregarlo a una rutina."
          />
        ) : null}
        {blocks.status === "ready" && blocks.data.length === 0 ? (
          <div className="-mt-2 flex justify-center">
            <Link href="/pool/bloques/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Crear bloque
            </Link>
          </div>
        ) : null}
        {blocks.status === "ready" && blocks.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {blocks.data.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-[var(--r-lg)] border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/pool/bloques/${block.id}/editar`} className="flex flex-col text-sm" style={{ color: "var(--text)" }}>
                  <span className="font-medium">{block.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{blockSummary(block)}</span>
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${block.name}`}
                  onClick={() => setBlockToDelete(block)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Elementos
          </h2>
          <Link href="/pool/elementos/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            + Nuevo elemento
          </Link>
        </div>

        {equipment.status === "loading" ? <ListSkeleton rows={3} /> : null}
        {equipment.status === "error" ? <ErrorState message="No se pudieron cargar los elementos." onRetry={loadEquipment} /> : null}
        {equipment.status === "ready" && equipment.data.length === 0 ? (
          <EmptyState
            icon={CubeIcon}
            title="Todavía no hay elementos"
            description="Creá el equipamiento que usás para poder asignarlo a un ejercicio."
          />
        ) : null}
        {equipment.status === "ready" && equipment.data.length === 0 ? (
          <div className="-mt-2 flex justify-center">
            <Link href="/pool/elementos/nuevo" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Crear elemento
            </Link>
          </div>
        ) : null}
        {equipment.status === "ready" && equipment.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {equipment.data.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-[var(--r-lg)] border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/pool/elementos/${item.id}/editar`} className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {item.name}
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar ${item.name}`}
                  onClick={() => setEquipmentToDelete(item)}
                  className="flex h-11 w-11 items-center justify-center"
                  style={{ color: "var(--danger)" }}
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <QuickSelector
        open={filterSelectorOpen}
        title="Filtrar por equipo"
        items={filterSelectorItems}
        onSelect={handleSelectFilter}
        onClose={() => setFilterSelectorOpen(false)}
        emptyActionLabel="Crear elemento"
        onEmptyAction={() => setFilterSelectorOpen(false)}
      />

      <ConfirmDialog
        open={exerciseToDelete !== null}
        title={`¿Borrar ${exerciseToDelete?.name ?? "el ejercicio"}?`}
        description="Se borra el ejercicio del pool. Si está en uso en algún bloque, no se va a poder borrar."
        confirmLabel="Borrar ejercicio"
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
      />

      <ConfirmDialog
        open={blockToDelete !== null}
        title={`¿Borrar ${blockToDelete?.name ?? "el bloque"}?`}
        description="Se borra el bloque del pool. Las rutinas que ya lo usan no se ven afectadas, porque tienen su propia copia."
        confirmLabel="Borrar bloque"
        onConfirm={confirmDeleteBlock}
        onCancel={() => setBlockToDelete(null)}
      />

      <ConfirmDialog
        open={equipmentToDelete !== null}
        title={`¿Borrar ${equipmentToDelete?.name ?? "el elemento"}?`}
        description="Se borra el elemento del pool. Si está en uso en algún ejercicio, no se va a poder borrar."
        confirmLabel="Borrar elemento"
        onConfirm={confirmDeleteEquipment}
        onCancel={() => setEquipmentToDelete(null)}
      />
    </div>
  );
}
