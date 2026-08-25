# Fit — Contexto del proyecto

**Fit** es una app personal (un solo usuario) para armar rutinas de entrenamiento y ejecutarlas en tiempo real con un timer integrado (EMOM, AMRAP, intervalos work/rest, timer libre).

## Stack

- **Monorepo:** `pnpm`, con `/frontend` y `/backend`
- **Frontend:** Next.js (App Router) + Tailwind CSS + TypeScript strict. Puerto `3000`
- **Backend:** NestJS + TypeScript strict + PostgreSQL + Prisma. Puerto `3001` (PostgreSQL en `5432`)
- **Auth:** no hay. v1 es single-user sin login
- **Offline:** cache local en el frontend (IndexedDB / service worker) para que Modo entrenar funcione sin conexión

Detalle completo en `docs/architecture.md`; estándares transversales en `docs/technical.md`.

## Regla de oro — No escaparse de lo definido

Implementá / documentá **EXACTAMENTE** lo que está definido en la documentación del proyecto (`docs/requirements.md`, `docs/screens.md`, `docs/data-model.md`, `docs/technical.md` y las decisiones ya cerradas). No inventes, no agregues alcance, no cambies rutas, nombres, comportamientos ni decisiones por tu cuenta, ni "para destrabar".

Si aparece un conflicto entre la spec y el código existente, una ambigüedad, una decisión no tomada, o cualquier duda → **FRENÁ TODO y preguntá** (al orquestador) antes de continuar. Nunca improvises una solución ni asumas un default no escrito.

**Ante la duda, se pregunta; no se inventa.**

## Agentes

El workflow de este proyecto está manejado por agentes en `.claude/agents/`:

- **`orchestrator`** — agente por defecto. Analiza, propone, delega y maneja git.
- **`analyst`** — análisis funcional, requerimientos y definición de pantallas; escriba de la documentación funcional y técnica (`docs/` y `.claude/agents/`), excepto la documentación de diseño. Invocado por el orquestador cuando: (a) un pedido agrega o cambia un requerimiento funcional o una pantalla (antes de cerrar la decisión), o (b) hay que escribir/actualizar documentación.
- **`design`** — diseño visual: define el lenguaje visual (color, tipografía, ubicación, tamaño, jerarquía, comportamiento visual) y produce especificaciones de diseño que `frontend` implementa. Único escriba de `docs/design.md` y de las specs visuales. No escribe código de la app, no toca implementación, no hace git. Invocado por el orquestador.
- **`frontend`** — implementa cambios en el frontend. Invocado por el orquestador.
- **`backend`** — implementa cambios en el backend. Invocado por el orquestador.

## Decisiones de diseño

- **Fit es una app personal de entrenamiento, nunca una red social.** Sin feed, seguidores, likes, comentarios ni "compartir con". Ninguna superficie implica a otra persona. Límite duro y permanente.
- **Tampoco es tracker nutricional, plataforma de coaching/marketplace, ni integra wearables.** Límites duros y permanentes: no se proponen ni se discuten.
- **Single-user sin auth en v1.** No hay login, ni guard de auth, ni scoping por usuario. Multi-usuario es una versión futura: no se anticipa el dato ni la arquitectura ahora.
- **El flujo core es crear rutina → Modo entrenar → timer → terminar.** Si eso no anda, el producto no existe. Toda propuesta se juzga contra ese flujo.
- **TDD estricto, sin excepción.** Todo código nuevo, frontend y backend, se escribe test-first (ver `docs/technical.md` §Testing).
- **Offline-first en Modo entrenar.** El timer y la ejecución funcionan sin conexión; se sincroniza al recuperar red (RN-004).
- **El historial es inmutable.** Editar o borrar rutinas, bloques o ejercicios nunca altera registros ya guardados (RN-001).
- **Corre solo en local.** Sin deploy a internet, sin CI configurado.
- **El diseño visual tiene su propio agente (`design`).** El workflow para features visuales/UI es **design → frontend**: `design` produce el spec visual (color, tipografía, tamaño, ubicación, jerarquía) y `frontend` lo implementa. La guía viva del lenguaje visual vive en `docs/design.md`, de la que `design` es el único escriba.
- **QA visual al cierre de tareas con UI.** Para toda tarea con superficie visual/UI, el orquestador corre un QA visual per-feature (paso 5.5 del flujo): lo ejecuta él directo contra el navegador conectado vía `/chrome`, con hand-off del prompt al usuario en la extensión Claude para Chrome como fallback si el navegador no está disponible. El asset vivo (prompt genérico + plantilla per-feature) vive en `docs/qa-visual.md`.
