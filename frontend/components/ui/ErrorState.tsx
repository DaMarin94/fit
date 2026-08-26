import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";

/** Estado de error con reintentar (`docs/screens.md`, presente en toda pantalla que carga datos). */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border px-6 py-12 text-center" style={{ borderColor: "var(--danger)" }}>
      <ExclamationTriangleIcon className="h-8 w-8" aria-hidden="true" style={{ color: "var(--danger)" }} />
      <p className="max-w-sm text-sm" style={{ color: "var(--text)" }}>
        {message}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
