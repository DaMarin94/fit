"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EquipmentForm } from "@/components/pool/EquipmentForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { listEquipment, updateEquipment } from "@/lib/api/equipment";
import type { Equipment } from "@/types/domain";

/**
 * Editar elemento. No hay `GET /equipment/:id` en el contrato: se resuelve
 * buscando en el listado completo, igual que se hace con ejercicios.
 */
export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "not-found" } | { status: "ready"; equipment: Equipment }
  >({ status: "loading" });

  useEffect(() => {
    listEquipment()
      .then((data) => {
        const equipment = data.find((e) => e.id === id);
        setState(equipment ? { status: "ready", equipment } : { status: "not-found" });
      })
      .catch(() => setState({ status: "error" }));
  }, [id]);

  async function handleSubmit(name: string) {
    await updateEquipment(id, { name });
    router.push("/pool");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Editar elemento
      </h1>
      {state.status === "loading" ? <ListSkeleton rows={1} /> : null}
      {state.status === "error" ? (
        <ErrorState
          message="No se pudo cargar el elemento."
          onRetry={() => {
            setState({ status: "loading" });
            listEquipment()
              .then((data) => {
                const equipment = data.find((e) => e.id === id);
                setState(equipment ? { status: "ready", equipment } : { status: "not-found" });
              })
              .catch(() => setState({ status: "error" }));
          }}
        />
      ) : null}
      {state.status === "not-found" ? (
        <p style={{ color: "var(--text-muted)" }}>No encontramos este elemento.</p>
      ) : null}
      {state.status === "ready" ? (
        <EquipmentForm
          initialName={state.equipment.name}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/pool")}
        />
      ) : null}
    </div>
  );
}
