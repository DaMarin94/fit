"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * Selector rápido (`docs/screens.md` §6): un único componente, dos
 * presentaciones según la disposición (`docs/design.md` §8.4/§8.5) — hoja
 * inferior en compacto, diálogo centrado de 560px en amplio. Mismo
 * comportamiento funcional en las dos: elegir, buscar por nombre, cerrar
 * sin elegir.
 */
export type QuickSelectorItem = { id: string; name: string };

export type QuickSelectorProps = {
  open: boolean;
  title: string;
  items: QuickSelectorItem[] | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  emptyActionLabel: string;
  onEmptyAction: () => void;
};

export function QuickSelector({
  open,
  title,
  items,
  onSelect,
  onClose,
  emptyActionLabel,
  onEmptyAction,
}: QuickSelectorProps) {
  const [query, setQuery] = useState("");

  function handleClose() {
    setQuery("");
    onClose();
  }

  function handleSelect(id: string) {
    setQuery("");
    onSelect(id);
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center wide:items-center">
      <div
        data-testid="quick-selector-backdrop"
        className="absolute inset-0"
        style={{ background: "rgba(18,21,28,.40)" }}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex w-full flex-col rounded-t-[var(--r-lg)] wide:w-full wide:max-w-[560px] wide:rounded-[var(--r-lg)]"
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          maxHeight: "min(90dvh, calc(100dvh - 32px))",
        }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div
            className="flex items-center gap-2 rounded-[var(--r-md)] border px-3"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden="true" style={{ color: "var(--text-muted)" }} />
            <input
              role="searchbox"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filtered === null ? (
            <ListSkeleton rows={4} />
          ) : filtered.length === 0 && items && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Todavía no hay nada acá.
              </p>
              <Button onClick={onEmptyAction}>{emptyActionLabel}</Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No encontramos resultados para “{query}”.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="flex min-h-11 w-full items-center rounded-[var(--r-md)] px-3 text-left text-sm"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
