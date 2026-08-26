"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Jerarquía de botones (`docs/design.md` §6.3). Cuatro variantes cerradas;
 * no se agregan combinaciones nuevas de color sin pasar por `design`.
 */
export type ButtonVariant = "primary" | "secondary" | "subtle" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};

const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "var(--accent-fg)" },
  secondary: {
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border-strong)",
  },
  subtle: { background: "transparent", color: "var(--text-muted)" },
  destructive: {
    background: "transparent",
    color: "var(--danger)",
    border: "1px solid var(--danger)",
  },
};

/**
 * Botón base con los estados obligatorios de `docs/design.md` §6.2:
 * cargando (conserva ancho, no colapsa) y deshabilitado (opacidad 0.45).
 * El feedback de "presionado" se apoya en `:active` vía Tailwind.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading = false,
    fullWidth = false,
    disabled,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{ ...VARIANT_STYLE[variant], ...rest.style }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--r-md)] px-4 text-sm font-semibold transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
});
