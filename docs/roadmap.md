# Roadmap — v1

**Doc de trabajo descartable.** Se borra al cerrar la v1. No es registro histórico ni fuente de verdad: el estado de implementación vive en `docs/features.md` y el alcance en `docs/requirements.md` §2.

Lo que aporta este doc es **el orden de entrega**, no el detalle funcional. Cada fase referencia por ID lo que ya está definido en `docs/requirements.md` (RF / RN / RNF), `docs/data-model.md` (entidades y contratos) y `docs/screens.md` (pantallas). Nada se redefine acá.

---

## Estado

v1 **en implementación**. La documentación funcional, de datos y técnica está cerrada; arranca el código por fases.

**Sin pendientes bloqueantes.**

---

## Criterio de fasado

- Primero corre el **flujo core** (`requirements.md` §1.2). Todo lo demás viene después.
- El equipamiento (RF-016 a RF-018) se separa del flujo core: no lo bloquea y se agrega encima.
- El offline (RN-004) llega cuando Modo entrenar ya funciona online: es una capa sobre una pantalla que ya existe.
- **TDD estricto desde el primer commit de código** (RNF-001). No hay fase de "después le agrego los tests".

---

## Fase 0 — Bootstrap técnico — **Hecha**

Dejar el monorepo listo para escribir features. Sin features. Lo construido está documentado en `docs/backend.md` y `docs/frontend.md`.

| Área | Entregable |
|---|---|
| Monorepo | `pnpm` con `/frontend` y `/backend` (`architecture.md` §1) |
| Backend | NestJS + Prisma conectado a la Postgres local, exception filter global con la forma de error de `data-model.md` §4.1, logging básico (`technical.md` §4) |
| Frontend | Next.js App Router + Tailwind + TS strict, cliente HTTP centralizado con toast de error (`technical.md` §2.2), shell de navegación con la barra de tabs (`screens.md` §1), boot script de tema (sigue al SO por defecto y respeta la preferencia guardada, RN-011) |
| Testing | Jest en backend y Vitest + React Testing Library en frontend, configurados y corriendo (`technical.md` §5) |
| Entorno | `.env` y `.env.example` por carpeta (`technical.md` §6) |

**Schema Prisma inicial:** `Exercise`, `Block`, `BlockExercise`, `Routine`, `Day` (con sus bloques copiados) y `WorkoutLog`, según `data-model.md` §2. **`Equipment` y los grupos de equipo no entran acá** — llegan en la Fase 2 con su propia migración.

---

## Fase 1 — Flujo core — **Hecha**

Crear rutina → Modo entrenar → timer → terminar, sin equipamiento. Lo construido está documentado en `docs/backend.md` y `docs/frontend.md`.

**Cubre:** RF-001 a RF-013 y RF-015. RN-001, RN-002, RN-003, RN-005 a RN-011.

### Backend

- CRUD de `Exercise` (RF-001), con bloqueo de borrado en uso (RN-007).
- CRUD de `Block` con sus `BlockExercise` y las cuatro configuraciones de timer (RF-002, RF-003, `data-model.md` §2.5).
- CRUD de `Routine` con sus `Day` y los bloques **copiados** al día (RF-004 a RF-006, RN-002, RN-003).
- Endpoint de terminar entrenamiento: crea el `WorkoutLog` con el snapshot congelado (RF-012, RF-013, RN-001).
- Unicidad de nombres (RN-005), validación de tiempos y reps positivos (RN-006) y borrado lógico (RN-008) en todo lo anterior.
- **Semilla:** pool de ejercicios y bloques + rutina de ejemplo de `requirements.md` §6, **sin elementos ni grupos de equipo** (se completa en la Fase 2).

### Frontend

| Pantalla | Alcance en esta fase |
|---|---|
| Mis rutinas (`screens.md` §2) | Completa: listar, crear, editar, borrar, entrenar |
| Editor de rutina (`screens.md` §3) | Completo: días, bloques encadenados, agregar del pool o ad-hoc |
| Pool (`screens.md` §4) | **Mínimo:** listados y edición de bloques y ejercicios. Sin elementos, sin grupos de equipo y sin filtro |
| Selector rápido (`screens.md` §6) | Para bloques y ejercicios |
| Modo entrenar (`screens.md` §5) | **Completo:** los cuatro timers (RF-008), avisos de transición (RF-009), pausar / reanudar / avanzar (RF-010), avance automático o manual (RF-011, RN-009), confirmación de salida (RN-010) y terminar guardando historial (RF-012, RF-013) |
| Historial (`screens.md` §7) | Lista de entrenamientos con fecha y rutina, y detalle del snapshot completo. Sin la agrupación por semana y día calendario de RN-012, que es de la Fase 4 |

Además: toggle de tema claro/oscuro funcional en el header de Mis rutinas (RF-015, RN-011).

---

## Fase 2 — Equipamiento — **Hecha**

**Cubre:** RF-016, RF-017, RF-018, RN-013, RN-014, RN-015.

### Backend

- CRUD de `Equipment` (RF-016) con bloqueo de borrado en uso (RN-013).
- Grupos de equipo por ejercicio (RF-017, RN-014, `data-model.md` §2.3).
- Filtro del pool de ejercicios por elemento, incluido el caso "sin equipo" (RF-018).
- Congelado del equipamiento en el snapshot del `WorkoutLog` (RN-015, `data-model.md` §2.9).
- **Semilla actualizada** con los elementos y los grupos de `requirements.md` §6.1 —incluido el grupo alternativo de *remos* {kettlebell, mancuernas}.

### Frontend

- ABM de elementos en el Pool (`screens.md` §4).
- Editor de grupos de equipo dentro de la edición de ejercicio, con el selector rápido sobre elementos.
- Filtro del listado de ejercicios por elemento, visible y limpiable.

> **Spec visual:** `docs/design.md` §11.

---

## Fase 3 — Offline en Modo entrenar — **es la fase actual**

**Cubre:** RN-004, RNF-004. Decisiones estructurales en `technical.md` §8 y `architecture.md` §5.

- Cache local del día a entrenar en el frontend.
- El timer corre sin red, sin depender del backend para contar ni avisar transiciones.
- Indicador de sincronización pendiente en Modo entrenar (`screens.md` §5, estado "Sin conexión").
- Sincronización del `WorkoutLog` al recuperar la conexión.

---

## Fase 4 — Historial completo y pulido

**Cubre:** RF-014 en su forma final y el cierre de calidad de la v1.

- Agrupación del historial por semana lunes-domingo y por día calendario (RN-012). Es lo único que le falta a RF-014: el detalle del snapshot completo ya existe.
- El detalle muestra lo que el snapshot contenga (RN-001): su equipamiento congelado (RN-015) aparece ahí en cuanto lo escribe la Fase 2.
- **Repaso de QA visual** sobre todo lo entregado en las fases anteriores, con el prompt y la plantilla de `docs/qa-visual.md` (paso 5.5 del flujo del orquestador).
- Verificación de la definición de "v1 terminada" (`requirements.md` §2.3).
