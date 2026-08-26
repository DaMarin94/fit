"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "./tabs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { requestGuardedNavigation } from "@/lib/training/exit-guard-store";

/**
 * Navegación global (`docs/screens.md` §1). Mismos tres destinos, mismo
 * orden y mismos labels en las dos disposiciones; solo cambia posición y
 * orientación (`docs/design.md` §7, §8.3): tabs inferiores en compacto
 * (< --bp-wide), barra superior en amplio (>= --bp-wide). No resta ancho
 * al contenido en ninguna disposición: las dos son `fixed` y horizontales.
 *
 * Tocar un tab con el timer de Modo entrenar corriendo dispara la
 * confirmación de RN-010 (`docs/design.md` §7.3): acá se consulta la
 * guardia de `lib/training/exit-guard-store.ts` antes de dejar navegar.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function handleTabClick(event: React.MouseEvent, href: string) {
  if (requestGuardedNavigation(href)) {
    event.preventDefault();
  }
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t wide:hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = active ? tab.SolidIcon : tab.OutlineIcon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={(e) => handleTabClick(e, tab.href)}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-[11px]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 top-0 z-40 hidden h-14 items-center border-b wide:flex"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex w-full max-w-[960px] items-center px-6">
          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
            Fit
          </span>
          <div className="ml-8 flex items-center gap-6">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={(e) => handleTabClick(e, tab.href)}
                  aria-current={active ? "page" : undefined}
                  className="relative py-2 text-sm font-semibold"
                  style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {tab.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-0.5"
                      style={{ background: "var(--accent)" }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
