"use client";

import { useRouter } from "next/navigation";
import { EquipmentForm } from "@/components/pool/EquipmentForm";
import { createEquipment } from "@/lib/api/equipment";

/** Crear elemento (`docs/screens.md` §4, RF-016). Pantalla propia, no modal (§8). */
export default function NewEquipmentPage() {
  const router = useRouter();

  async function handleSubmit(name: string) {
    await createEquipment({ name });
    router.push("/pool");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Nuevo elemento
      </h1>
      <EquipmentForm submitLabel="Crear elemento" onSubmit={handleSubmit} onCancel={() => router.push("/pool")} />
    </div>
  );
}
