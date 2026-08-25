import {
  ClipboardDocumentListIcon as RutinasOutline,
  ArchiveBoxIcon as PoolOutline,
  ClockIcon as HistorialOutline,
} from "@heroicons/react/24/outline";
import {
  ClipboardDocumentListIcon as RutinasSolid,
  ArchiveBoxIcon as PoolSolid,
  ClockIcon as HistorialSolid,
} from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";

export type TabDefinition = {
  href: string;
  label: string;
  OutlineIcon: ComponentType<SVGProps<SVGSVGElement>>;
  SolidIcon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Los tres destinos de la navegación global (`docs/screens.md` §1). El
 * orden y los labels no cambian entre disposición compacta y amplia.
 */
export const TABS: TabDefinition[] = [
  {
    href: "/",
    label: "Rutinas",
    OutlineIcon: RutinasOutline,
    SolidIcon: RutinasSolid,
  },
  {
    href: "/pool",
    label: "Pool",
    OutlineIcon: PoolOutline,
    SolidIcon: PoolSolid,
  },
  {
    href: "/historial",
    label: "Historial",
    OutlineIcon: HistorialOutline,
    SolidIcon: HistorialSolid,
  },
];
