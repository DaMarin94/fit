import type { ComponentType, SVGProps } from "react";
import { Button } from "./Button";

/**
 * Estado vacío (`docs/design.md` §6.4): nunca mudo. Ícono de trazo, título
 * `h2`, descripción `body-sm`, y la acción que lo resuelve como botón
 * primario.
 */
export type EmptyStateProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border px-6 py-12 text-center" style={{ borderColor: "var(--border)" }}>
      <Icon className="h-8 w-8" aria-hidden="true" style={{ color: "var(--text-muted)" }} />
      <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <p className="max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-2">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
