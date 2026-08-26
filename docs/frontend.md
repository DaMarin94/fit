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
| `/pool/elementos/nuevo`, `/pool/elementos/[id]/editar` | Alta y edición de elemento del pool |
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
| `EquipmentForm` | Formulario de alta y edición de un elemento del pool: solo el nombre, mismo patrón que `ExerciseForm` |
| `QuickSelector` | El selector rápido único de `screens.md` §6, usado para bloques, ejercicios y elementos. Elige elementos al armar un grupo de equipo en `ExerciseForm` y resuelve el filtro de ejercicios por elemento en Pool — ahí el listado va precedido por dos ítems sintéticos, "Todos los equipos" y "Sin equipo", que no son elementos reales del pool. Se muestra como hoja inferior en compacto y como diálogo centrado en amplio |
| `TrainingScreen` | Modo entrenar completo (`screens.md` §5): consume `use-session` y pinta fase, tiempo, ejercicio actual y los controles de RF-010 / RF-011. También la franja de estado de conectividad de `design.md` §12, con `role="status"` propio, **separado** de la región `aria-live` del timer (si compartieran región, cada cambio de fase reanunciaría "Sin conexión") |
| `OfflineSyncListener` | No renderiza nada. Montado en el layout raíz, es el único punto que dispara la sincronización de la cola de entrenamientos pendientes (ver §Offline) |
| `ConfirmDialog` | Diálogo de confirmación genérico. Lo usan la confirmación de salida de Modo entrenar (RN-010) y el resto de las confirmaciones destructivas de `screens.md` §8 |
| `lib/training/exit-guard-store.ts` | Store que marca si hay una sesión de entrenamiento en curso. `NavBar` lo consulta antes de navegar para interceptar la salida (RN-010); el propio store intercepta además `popstate` y `beforeunload` |

## Design system portado

Cómo los tokens y las escalas de `docs/design.md` se materializan en la configuración de Tailwind y en los estilos globales.

- **Color:** los tokens de `design.md` §3.4 y §3.5 (claro y oscuro, acento, semánticos y fases del timer) están volcados literalmente en `app/globals.css`, bajo los selectores `[data-theme="light"]` y `[data-theme="dark"]`.
- **Breakpoint:** el umbral único se declara como `@theme { --breakpoint-wide: 1024px }`, que es lo que habilita el prefijo `wide:` de Tailwind v4 (`design.md` §8.1).
- **Tipografías:** cargadas con `next/font/google`. Inter como `--font-sans` y JetBrains Mono como `--font-mono`, esta última para los numerales tabulares del timer (`design.md` §4.1, §4.2).

Los tokens de fase del timer (`--phase-*`) y `--font-mono` se consumen en `TrainingScreen`: el color de la pantalla sigue la fase activa y el contador se pinta con la tipografía tabular. Entre esos tokens está `--phase-veil`, el relleno de la franja de estado de conectividad, que sobre los tres fondos de fase hereda `currentColor` (`design.md` §12.3).

## Capa de datos

Wrapper de llamadas HTTP, manejo de errores y toasts. El estándar está en `docs/technical.md` §2; acá va la implementación concreta.

| Archivo | Rol |
|---|---|
| `lib/http/api-client.ts` | Único punto de salida de requests. Entiende las dos formas de éxito (`{ data }` o el recurso directo) y la forma de error (`{ error: { message, code } }`) de `data-model.md` §4.1. Ante cualquier error —incluido fallo de red— dispara el toast por su cuenta y relanza un `ApiError` con su `code`, para que el componente pueda hacer manejo específico. `ApiFetchOptions` acepta `silent`, que omite el toast automático sin dejar de lanzar el error (`technical.md` §2.2), e `isNetworkError()` distingue el fallo de red de una respuesta de error del servidor |
| `lib/toast/toast-store.ts` | Store pub-sub sin dependencias de React; los componentes lo consumen con `useSyncExternalStore` |
| `lib/api/exercises.ts`, `blocks.ts`, `equipment.ts`, `routines.ts`, `workout-logs.ts` | Wrappers tipados por recurso sobre `api-client`. Son el único lugar donde el frontend nombra rutas del backend; los componentes llaman funciones, no URLs. Los endpoints están en `docs/backend.md` §Endpoints. `getRoutine`, `listExercises` y `createWorkoutLog` aceptan además `{ silent }` y lo reenvían a `apiFetch` |
| `lib/validation/schemas.ts` | Esquemas Zod que espejan el contrato del backend y validan los formularios antes de enviar: nombre obligatorio, tiempos y repeticiones positivos (RN-006) y `timerConfig` según el `type` del bloque. La unicidad de nombre (RN-005) no se resuelve acá: la decide el backend y llega como `NAME_TAKEN`. El backend igual revalida todo; esto es feedback inmediato, no la fuente de verdad |

## Offline

Cache local y sincronización. El requisito está en RN-004 y RNF-004, la decisión estructural en `docs/architecture.md` §Offline y `docs/technical.md` §8, y el estado visual en `docs/design.md` §12. Es **solo frontend**: el backend recibe la sincronización como escrituras normales.

El mecanismo es **IndexedDB**, con la librería `idb` (wrapper con promesas sobre la API nativa). Base `fit-offline`, dos object stores:

| Store | Clave | Contenido |
|---|---|---|
| `training-cache` | `routineId` | Última `Routine` completa traída con éxito más el mapa `exerciseNameById`. Es lo que hace que Modo entrenar cargue sin red |
| `workout-log-queue` | `id` | `WorkoutLog` pendientes de sincronizar: uno por "Terminar entrenamiento" que no llegó al backend |

| Archivo | Rol |
|---|---|
| `lib/offline/db.ts` | Conexión y creación de los dos stores |
| `lib/offline/training-cache.ts` | Lectura y escritura de la cache del día a entrenar. **Best-effort:** traga sus propios errores, porque es una optimización y no la fuente de verdad — sin IndexedDB la app sigue andando online igual |
| `lib/offline/workout-log-queue.ts` | Cola de pendientes. Acá los errores **sí se propagan**: es la única copia del entrenamiento pendiente. Cada ítem lleva un `seq` monotónico porque el orden de `getAll()` sigue la clave, no el de inserción, y `queuedAt` colisiona dentro del mismo milisegundo |
| `lib/offline/workout-log-sync.ts` | `syncPendingWorkoutLogs()` drena la cola contra `createWorkoutLog` y devuelve `{ synced }` |
| `lib/offline/connectivity-store.ts` | Store pub-sub sobre `navigator.onLine` y los eventos `online` / `offline` (mismo patrón que `lib/toast/toast-store.ts`); hook `useIsOnline()` |
| `lib/offline/workout-log-sync-status.ts` | Pub-sub que envuelve el sync y difunde `start` / `done` con la cantidad sincronizada. Nunca emite `start` con la cola vacía |
| `lib/offline/use-offline-indicator-state.ts` | Máquina de estados de la franja de `design.md` §12: variantes `offline`, `syncing`, `saved` o ninguna, con sus tiempos mínimos y el anti-parpadeo si la red vuelve a caer a mitad del ciclo |

**Los dos patrones:**

- **Día a entrenar — cache en el éxito, fallback en el fallo.** `app/entrenar/[routineId]/[dayId]/page.tsx` cachea rutina y nombres en cada fetch online exitoso; si el fetch falla, intenta la cache antes de dar la pantalla por perdida. Solo si tampoco hay cache se avisa el error.
- **Terminar entrenamiento — cola y sync.** Si el `POST` falla por red, `TrainingScreen` encola el log y navega igual: terminar **nunca se bloquea por falta de red** (RF-013). El `performedAt` se captura en el momento de terminar, no al sincronizar, porque es el dato que alimenta la agrupación de RN-012.

El criterio para separar "no hay red" de "el servidor respondió un error" es `isNetworkError()` de `lib/http/api-client.ts` (`ApiError` con `code === "NETWORK_ERROR"`). Solo el primer caso degrada a cache o cola; un error real del servidor se reporta como cualquier otro. Por eso `syncPendingWorkoutLogs` corta el drenado entero ante el primer `NETWORK_ERROR` —seguir sería un toast de red por cada ítem restante— pero ante un error del servidor sigue con el resto y deja ese ítem en cola para el próximo intento.

`OfflineSyncListener` (montado una sola vez en `app/layout.tsx`) es el **único** disparador del sync: lo corre al montar si ya hay red y en cada reconexión. Cualquier UI que necesite el estado del sync se suscribe a `workout-log-sync-status.ts`.

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

Cubiertos con tests escritos antes que la implementación: el tema y su boot script, el store de toasts, el cliente HTTP y los wrappers de `lib/api` (con `fetch` mockeado), los esquemas Zod, el `NavBar` en sus dos disposiciones, las pantallas, el motor del timer y la capa offline.

El grueso del esfuerzo está en el **motor del timer probado sin UI**: `session-plan` y `session-engine` no dependen de React, así que se ejercitan con tics de tiempo inyectados en vez de renderizar y esperar. La capa offline se prueba con **`fake-indexeddb`** como dev dependency, porque jsdom no trae IndexedDB. La suite completa son 254 tests en 51 archivos.

## Gotchas

- **Persistencia del tema:** atributo `data-theme` en `<html>` y clave `fit-theme` en `localStorage`. Es una decisión de implementación, no visual: `design.md` §2.1 fija el comportamiento (sigue al SO hasta que el usuario elige, RN-011) y no el mecanismo.
- **El toast no tiene spec visual propio** en `docs/design.md` (posición, animación de entrada y salida, iconografía). Se arma con tokens ya existentes —superficie, color semántico de error y éxito, radios, espaciado—, sin valores nuevos. Queda como spec pendiente de `design`.
- **"Terminar entrenamiento" está disponible en cualquier momento** después de iniciar, no solo al cerrar el último bloque: `screens.md` §5 no lo restringe.
- **El aviso de transiciones (RF-009) no tiene componente propio.** Lo resuelve la propia pantalla al ser reactiva —el color de fase, el rótulo y el número cambian en el instante de la transición— más `aria-live` para que se anuncie. No se agregó un toast ni un cartel nuevo porque `docs/design.md` no especifica ninguno.
- **Los campos de tiempo de los formularios de bloque son segundos crudos**, no un par minuto + segundo: `docs/design.md` no especifica ese control.
- **La línea de equipo de solo lectura está duplicada a propósito.** Pool y el detalle de Historial la pintan con dos componentes locales distintos —`EquipmentLine` en `app/pool/page.tsx`, que resuelve `equipmentId` → nombre contra un mapa armado con el pool de elementos, y `SnapshotEquipmentLine` en `app/historial/page.tsx`, que ya recibe los nombres congelados por valor (RN-015)—. Las dos siguen el mismo spec visual (`docs/design.md` §11.2-§11.5: contención para el "O", cajas separadas con la palabra "Y" en mayúscula para el "Y", sin color). No hay un componente compartido porque no existía un patrón previo de componente común a esas dos pantallas.
- **`silent` no es "no reportar errores": es "acá el error no es una falla".** Se pasa solo en los caminos donde la app se degrada con gracia y el usuario no pierde nada —el fetch del día a entrenar que puede caer en la cache, el `POST` de terminar que puede caer en la cola—. El `ApiError` se sigue lanzando: si la degradación tampoco resuelve (no hay nada cacheado, el error no era de red), el llamador dispara el toast a mano. Sin `silent` la pantalla apila toasts rojos de "no se pudo conectar" arriba de un flujo que en los hechos funcionó.
- **El sync de la cola tiene un solo disparador: `OfflineSyncListener`.** No agregar un segundo lugar que llame `runWorkoutLogSync` —una pantalla que quiera "sincronizar al montar", por ejemplo—: dos disparadores compiten por la misma cola y duplican entrenamientos. Lo que se necesita es leer el estado, y eso se hace suscribiéndose a `lib/offline/workout-log-sync-status.ts`.
- **Un grupo de equipo vacío no es un estado alcanzable en el editor.** En `ExerciseForm`, "Agregar equipo" abre el selector rápido de una y el grupo nace con su primer elemento; quitar el último elemento hace desaparecer el grupo, y no hay botón "quitar grupo" propio. RN-014 se cumple por construcción: el guardado nunca se bloquea por el equipo.
