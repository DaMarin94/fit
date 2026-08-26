# Frontend — Fit

Arquitectura del frontend: estructura, componentes, design system portado y gotchas. Se completa a medida que hay código.

El stack está en `docs/architecture.md`; los estándares transversales en `docs/technical.md`; el lenguaje visual en `docs/design.md`.

---

## Estructura

Next.js 16 con App Router, TypeScript strict y Tailwind CSS v4. Sirve en el puerto `3000`.

Las tres tabs de `screens.md` §1 son las rutas raíz: `/` (Mis rutinas), `/pool` y `/historial`.

| Ruta | Pantalla |
|---|---|
| `/` | Mis rutinas (`screens.md` §2) |
| `/rutinas/nueva`, `/rutinas/[id]/editar` | Editor de rutina (`screens.md` §3) |
| `/pool` | Pool (`screens.md` §4) |
| `/pool/ejercicios/nuevo`, `/pool/ejercicios/[id]/editar` | Alta y edición de ejercicio del pool |
| `/pool/bloques/nuevo`, `/pool/bloques/[id]/editar` | Alta y edición de bloque del pool |
| `/entrenar/[routineId]/[dayId]` | Modo entrenar (`screens.md` §5) |
| `/historial` | Historial (`screens.md` §7) |

## Componentes

| Componente | Rol |
|---|---|
| `ThemeScript` | Script inline y bloqueante en el `<head>`: resuelve el modo de color antes de la hidratación, para que no haya destello (`design.md` §2.1, RN-011) |
| `NavBar` | **Las dos disposiciones existen a la vez en el DOM** y se muestran u ocultan por CSS con el prefijo `wide:`: tabs inferiores fijos en compacto, barra superior fija en amplio. Ninguna de las dos le resta ancho al contenido (`design.md` §8.3) |
| `ToastProvider` | Visor de toasts, montado en el layout raíz |
| `ThemeToggle` | Control de modo de color, montado en el header (RF-015, RN-011) |
| `RoutineEditor` | Editor del árbol de la rutina: días, bloques encadenados y sus ejercicios. Agregar un bloque —copiándolo del pool o creándolo ad-hoc (RF-006)— se resuelve en un overlay de pantalla completa. Reordenar días, bloques y ejercicios es con botones ↑/↓ |
| `QuickSelector` | El selector rápido único de `screens.md` §6, usado tanto para bloques como para ejercicios. Se muestra como hoja inferior en compacto y como diálogo centrado en amplio |
| `TrainingScreen` | Modo entrenar completo (`screens.md` §5): consume `use-session` y pinta fase, tiempo, ejercicio actual y los controles de RF-010 / RF-011 |
| `ConfirmDialog` | Diálogo de confirmación genérico. Lo usan la confirmación de salida de Modo entrenar (RN-010) y el resto de las confirmaciones destructivas de `screens.md` §8 |
| `lib/training/exit-guard-store.ts` | Store que marca si hay una sesión de entrenamiento en curso. `NavBar` lo consulta antes de navegar para interceptar la salida (RN-010); el propio store intercepta además `popstate` y `beforeunload` |

## Design system portado

Cómo los tokens y las escalas de `docs/design.md` se materializan en la configuración de Tailwind y en los estilos globales.

- **Color:** los tokens de `design.md` §3.4 y §3.5 (claro y oscuro, acento, semánticos y fases del timer) están volcados literalmente en `app/globals.css`, bajo los selectores `[data-theme="light"]` y `[data-theme="dark"]`.
- **Breakpoint:** el umbral único se declara como `@theme { --breakpoint-wide: 1024px }`, que es lo que habilita el prefijo `wide:` de Tailwind v4 (`design.md` §8.1).
- **Tipografías:** cargadas con `next/font/google`. Inter como `--font-sans` y JetBrains Mono como `--font-mono`, esta última para los numerales tabulares del timer (`design.md` §4.1, §4.2).

Los tokens de fase del timer (`--phase-*`) y `--font-mono` se consumen en `TrainingScreen`: el color de la pantalla sigue la fase activa y el contador se pinta con la tipografía tabular.

## Capa de datos

Wrapper de llamadas HTTP, manejo de errores y toasts. El estándar está en `docs/technical.md` §2; acá va la implementación concreta.

| Archivo | Rol |
|---|---|
| `lib/http/api-client.ts` | Único punto de salida de requests. Entiende las dos formas de éxito (`{ data }` o el recurso directo) y la forma de error (`{ error: { message, code } }`) de `data-model.md` §4.1. Ante cualquier error —incluido fallo de red— dispara el toast por su cuenta y relanza un `ApiError` con su `code`, para que el componente pueda hacer manejo específico |
| `lib/toast/toast-store.ts` | Store pub-sub sin dependencias de React; los componentes lo consumen con `useSyncExternalStore` |
| `lib/api/exercises.ts`, `blocks.ts`, `routines.ts`, `workout-logs.ts` | Wrappers tipados por recurso sobre `api-client`. Son el único lugar donde el frontend nombra rutas del backend; los componentes llaman funciones, no URLs. Los endpoints están en `docs/backend.md` §Endpoints |
| `lib/validation/schemas.ts` | Esquemas Zod que espejan el contrato del backend y validan los formularios antes de enviar: nombre obligatorio, tiempos y repeticiones positivos (RN-006) y `timerConfig` según el `type` del bloque. La unicidad de nombre (RN-005) no se resuelve acá: la decide el backend y llega como `NAME_TAKEN`. El backend igual revalida todo; esto es feedback inmediato, no la fuente de verdad |

## Offline

Cache local y sincronización. El requisito está en RN-004 y la decisión estructural en `docs/architecture.md` §Offline.

_Sin contenido todavía._

## Motor del timer

Ejecuta los cuatro tipos de bloque (RF-008) y el avance de RF-010 / RF-011. Vive en `lib/timer/`, **sin ninguna dependencia de React**, para poder testearse desacoplado de la UI.

| Archivo | Rol |
|---|---|
| `session-plan.ts` | Traduce el día a entrenar —bloques, `type` y `timerConfig` (`data-model.md` §2.5)— a un plan lineal de fases con su duración y su ejercicio asociado. Es una función pura: mismo día, mismo plan |
| `session-engine.ts` | Corre el plan: sabe en qué fase está, cuánto queda, y aplica pausar, reanudar y avanzar. Avanza por tics de tiempo que le pasan desde afuera; no tiene reloj propio |
| `use-session.ts` | Único punto con React: engancha el motor a un intervalo real de 1 s y expone el estado a `TrainingScreen` |

### Interpretaciones de implementación

Decisiones que ni `requirements.md` ni `screens.md` fijan; son cómo las resolvió el frontend, no reglas cerradas.

- **EMOM (`fuerza`):** cada intervalo se trata como 100 % trabajo. El `timerConfig` de `fuerza` no tiene campo de descanso, así que no hay de dónde derivar un split work/rest dentro del intervalo: el descanso real es lo que sobra después de hacer las reps, y cuánto tarda la persona no es un dato que el sistema conozca.
- **AMRAP (`metcon`):** el cronómetro del bloque corre solo; el avance de ejercicio y de ronda es manual, con el botón "Avanzar". No hay dato de cuánto dura una ronda, así que el motor no puede inferirlo.
- **Intervalos:** la lista de ejercicios se cicla completa una vez por ronda (round-robin). Es la lectura que calza exacto con el bloque de la semilla ("2 rondas de 4 ejercicios").
- **No hay cuenta regresiva de preparación** antes de arrancar: ningún RF ni pantalla la pide.

## Testing

Vitest + React Testing Library, TDD estricto (`docs/technical.md` §Testing). Acá van las convenciones propias del frontend: helpers, mocks y qué se testea a qué nivel.

Cubiertos con tests escritos antes que la implementación: el tema y su boot script, el store de toasts, el cliente HTTP y los wrappers de `lib/api` (con `fetch` mockeado), los esquemas Zod, el `NavBar` en sus dos disposiciones, las pantallas y el motor del timer.

El grueso del esfuerzo está en el **motor del timer probado sin UI**: `session-plan` y `session-engine` no dependen de React, así que se ejercitan con tics de tiempo inyectados en vez de renderizar y esperar. La suite completa son 173 tests.

## Gotchas

- **Persistencia del tema:** atributo `data-theme` en `<html>` y clave `fit-theme` en `localStorage`. Es una decisión de implementación, no visual: `design.md` §2.1 fija el comportamiento (sigue al SO hasta que el usuario elige, RN-011) y no el mecanismo.
- **El toast no tiene spec visual propio** en `docs/design.md` (posición, animación de entrada y salida, iconografía). Se arma con tokens ya existentes —superficie, color semántico de error y éxito, radios, espaciado—, sin valores nuevos. Queda como spec pendiente de `design`.
- **"Terminar entrenamiento" está disponible en cualquier momento** después de iniciar, no solo al cerrar el último bloque: `screens.md` §5 no lo restringe.
- **El aviso de transiciones (RF-009) no tiene componente propio.** Lo resuelve la propia pantalla al ser reactiva —el color de fase, el rótulo y el número cambian en el instante de la transición— más `aria-live` para que se anuncie. No se agregó un toast ni un cartel nuevo porque `docs/design.md` no especifica ninguno.
- **Los campos de tiempo de los formularios de bloque son segundos crudos**, no un par minuto + segundo: `docs/design.md` no especifica ese control.
