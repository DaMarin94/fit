# Backend — Fit

Estructura, capas, endpoints y comportamiento por módulo. Se completa a medida que hay código.

El stack está en `docs/architecture.md`; los estándares transversales en `docs/technical.md`; las entidades y el contrato de API en `docs/data-model.md`.

---

## Estructura y capas

Estructura estándar de NestJS: `src/main.ts` (bootstrap) y `src/app.module.ts` (módulo raíz). La app escucha en el puerto `3001`, con **CORS habilitado sin restricción de origen** (corre solo en local, RNF-002).

Cuatro piezas transversales, todas registradas globalmente:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Interceptor de respuesta | `src/common/interceptors/response.interceptor.ts` | Envuelve toda respuesta exitosa en `{ data }` (`data-model.md` §4.1) |
| Filtro de excepciones | `src/common/filters/all-exceptions.filter.ts` | Traduce cualquier error a `{ error: { message, code } }`. Es el único productor de respuestas de error (`technical.md` §2.1) |
| Middleware de logging | `src/common/middleware/logging.middleware.ts` | Loguea método, ruta y status. Nunca el body (`technical.md` §4) |
| `ValidationPipe` global | Registrado en el bootstrap | `whitelist`, `forbidNonWhitelisted` y `transform` sobre los DTOs de los módulos de dominio |

## Schema de Prisma

Cómo las entidades de `docs/data-model.md` se materializan en el schema: tablas, índices y restricciones de unicidad.

Entidades materializadas: `Exercise`, `Block` + `BlockExercise`, `Routine`, `Day` + `DayBlock` + `DayBlockExercise`, `Equipment` + `EquipmentGroup` + `EquipmentGroupItem`, y `WorkoutLog`.

- **`DayBlock` y `DayBlockExercise` son nombres internos del schema**, no aparecen en `data-model.md`: son las dos tablas que materializan los *bloques copiados* de un día (`data-model.md` §2.8), es decir el snapshot independiente del pool que exigen RN-002 y RN-003.
- **IDs:** todas las entidades usan `String @id @default(cuid())`. `data-model.md` habla de "ID técnico" sin fijar formato; el formato concreto se decide acá.
- **`EquipmentGroupItem` es también un nombre interno del schema** (mismo patrón que `DayBlockExercise`): la tabla puente entre un `EquipmentGroup` y los `Equipment` que lo componen.
- **`EquipmentGroup` no tiene `name` ni columna `order` propia**: el orden de los grupos de un ejercicio no es significativo (`data-model.md` §2.3). El orden de la respuesta igual es determinístico, por `orderBy: { id: 'asc' }` sobre `equipmentGroups` y sobre sus `items`.

## Endpoints

Rutas, bodies, respuestas y códigos de error. El envoltorio (`{ data }` en éxito, `{ error: { message, code } }` en error), el formato de fechas y la exclusión de borrados en los listados están en `docs/data-model.md` §4 y valen para todo lo de acá. Los shapes de las entidades son los de `data-model.md` §2; abajo se anota solo lo que cada endpoint agrega o recorta.

`VALIDATION_ERROR` (400) es transversal: lo produce el `ValidationPipe` global ante cualquier body que no cumpla el DTO.

### Exercises

`Exercise` en la respuesta es `{ id, name, equipmentGroups, deletedAt }`, donde **`equipmentGroups` es `string[][]`**: una lista de grupos, y cada grupo una lista de `equipmentId`. Dentro de un grupo los elementos son alternativas ("O"); entre grupos el requisito es conjunto ("Y"). `[]` o ausente significa sin equipo.

| Verbo y ruta | Body | Respuesta | Errores |
|---|---|---|---|
| `GET /exercises` | — | `{ data: Exercise[] }` | — |
| `GET /exercises?equipmentId=<id>` | — | `{ data: Exercise[] }` — solo los que listan ese elemento en alguno de sus grupos | — |
| `GET /exercises?equipmentId=none` | — | `{ data: Exercise[] }` — solo los que no declaran ningún grupo (RF-018) | — |
| `POST /exercises` | `{ name, equipmentGroups? }` | `{ data: Exercise }` (201) | `NAME_TAKEN`, `EQUIPMENT_NOT_FOUND` |
| `PATCH /exercises/:id` | `{ name, equipmentGroups? }` | `{ data: Exercise }` | `EXERCISE_NOT_FOUND`, `NAME_TAKEN`, `EQUIPMENT_NOT_FOUND` |
| `DELETE /exercises/:id` | — | `{ data: Exercise }` con `deletedAt` seteado | `EXERCISE_NOT_FOUND`, `EXERCISE_IN_USE` |

`"none"` es un **string reservado** del filtro, nunca un cuid válido; no colisiona con ningún `equipmentId` real.

`PATCH /exercises/:id` **reemplaza el conjunto completo de `equipmentGroups`**, no hace merge: mismo criterio de "editar es reemplazar" que rige `PATCH /blocks/:id`.

| Código | Status | Cuándo |
|---|---|---|
| `NAME_TAKEN` | 409 | Ya hay un ejercicio no borrado con ese nombre (RN-005) |
| `EXERCISE_NOT_FOUND` | 404 | No existe o está borrado |
| `EXERCISE_IN_USE` | 409 | Algún `BlockExercise` o `DayBlockExercise` lo referencia (RN-007) |
| `EQUIPMENT_NOT_FOUND` | 404 | Algún `equipmentId` de `equipmentGroups` no existe o está borrado |

### Equipment

`Equipment` en la respuesta es `{ id, name, deletedAt }`.

| Verbo y ruta | Body | Respuesta | Errores |
|---|---|---|---|
| `GET /equipment` | — | `{ data: Equipment[] }` | — |
| `POST /equipment` | `{ name }` | `{ data: Equipment }` (201) | `NAME_TAKEN` |
| `PATCH /equipment/:id` | `{ name }` | `{ data: Equipment }` | `EQUIPMENT_NOT_FOUND`, `NAME_TAKEN` |
| `DELETE /equipment/:id` | — | `{ data: Equipment }` con `deletedAt` seteado | `EQUIPMENT_NOT_FOUND`, `EQUIPMENT_IN_USE` |

| Código | Status | Cuándo |
|---|---|---|
| `NAME_TAKEN` | 409 | Ya hay un elemento no borrado con ese nombre (RN-005) |
| `EQUIPMENT_NOT_FOUND` | 404 | No existe o está borrado |
| `EQUIPMENT_IN_USE` | 409 | Algún `EquipmentGroupItem` lo referencia (RN-013) |

### Blocks

| Verbo y ruta | Body | Respuesta | Errores |
|---|---|---|---|
| `GET /blocks` | — | `{ data: Block[] }`, cada bloque con sus `exercises` ordenados | — |
| `POST /blocks` | Bloque completo (abajo) | `{ data: Block }` (201) | `NAME_TAKEN` |
| `PATCH /blocks/:id` | Bloque completo (abajo) | `{ data: Block }` | `BLOCK_NOT_FOUND`, `NAME_TAKEN` |
| `DELETE /blocks/:id` | — | `{ data: Block }` con `deletedAt` seteado | `BLOCK_NOT_FOUND` |

Body de creación y edición:

```json
{
  "name": "...",
  "type": "fuerza | metcon | intervalos | cardio_libre",
  "advanceMode": "automatico | manual",
  "timerConfig": { },
  "exercises": [{ "exerciseId": "...", "reps": 12, "duration": 60 }]
}
```

`PATCH /blocks/:id` es **reemplazo completo** del bloque y de su lista de ejercicios, no un patch parcial.

`DELETE /blocks/:id` **no se bloquea nunca**: las rutinas que usan ese bloque tienen su propia copia (RN-002), así que no hay referencia viva que proteger.

`timerConfig` según `type` (`data-model.md` §2.5):

| `type` | `timerConfig` |
|---|---|
| `fuerza` | `{ totalDurationSeconds, taskIntervalSeconds }` |
| `metcon` | `{ totalDurationSeconds }` |
| `intervalos` | `{ workSeconds, restSeconds, rounds }` |
| `cardio_libre` | `{}` — las fases las define la lista de `exercises` con su `duration` |

| Código | Status | Cuándo |
|---|---|---|
| `NAME_TAKEN` | 409 | Ya hay un bloque no borrado con ese nombre (RN-005) |
| `BLOCK_NOT_FOUND` | 404 | No existe o está borrado |

**Nota de implementación** (no está en los docs cerrados): en bloques de tipo `intervalos` los `exercises` no llevan `reps` ni `duration` propios — el tiempo de cada uno sale del `workSeconds` uniforme del `timerConfig`.

### Routines

| Verbo y ruta | Body | Respuesta | Errores |
|---|---|---|---|
| `GET /routines` | — | `{ data: [{ id, name, dayCount }] }` | — |
| `GET /routines/:id` | — | `{ data: Routine }` con el árbol completo | `ROUTINE_NOT_FOUND` |
| `POST /routines` | Rutina completa (abajo) | `{ data: Routine }` completo (201) | `NAME_TAKEN`, `EXERCISE_NOT_FOUND` |
| `PUT /routines/:id` | Rutina completa (abajo) | `{ data: Routine }` completo | `ROUTINE_NOT_FOUND`, `NAME_TAKEN`, `EXERCISE_NOT_FOUND` |
| `DELETE /routines/:id` | — | `{ data: Routine }` con `deletedAt` seteado | `ROUTINE_NOT_FOUND` |

`GET /routines` es un listado liviano: solo `id`, `name` y la cantidad de días. El árbol se pide con `GET /routines/:id`, que devuelve `days` ordenados → bloques copiados ordenados → `exercises` ordenados. **Cada ejercicio del árbol trae `exerciseId` pero no el nombre**: el cliente lo resuelve cruzando contra `GET /exercises`.

Body de creación y edición:

```json
{
  "name": "...",
  "days": [
    {
      "blocks": [
        {
          "name": "...",
          "type": "...",
          "advanceMode": "...",
          "timerConfig": { },
          "exercises": [{ "exerciseId": "...", "reps": 12, "duration": 60 }]
        }
      ]
    }
  ]
}
```

`PUT /routines/:id` es **reemplazo completo del árbol**: días, bloques y ejercicios se borran y se recrean.

**No hay endpoint para "agregar un bloque del pool a un día".** El frontend arma el árbol completo del lado cliente —copiando los datos del bloque del pool cuando corresponde— y lo manda entero al guardar. Guardado el árbol, el origen del bloque (pool o ad-hoc) es indistinguible, como especifica `docs/screens.md` §3.

| Código | Status | Cuándo |
|---|---|---|
| `NAME_TAKEN` | 409 | Ya hay una rutina no borrada con ese nombre (RN-005) |
| `ROUTINE_NOT_FOUND` | 404 | No existe o está borrada |
| `EXERCISE_NOT_FOUND` | 404 | Algún `exerciseId` del árbol no existe o está borrado |

### Workout logs

| Verbo y ruta | Body | Respuesta | Errores |
|---|---|---|---|
| `POST /routines/:routineId/days/:dayId/workout-logs` | `{ performedAt? }` (ISO 8601; default: ahora) | `{ data: WorkoutLog }` (201) | `ROUTINE_NOT_FOUND`, `DAY_NOT_FOUND` |
| `GET /workout-logs` | — | `{ data: WorkoutLog[] }` ordenado por `performedAt` descendente | — |

`WorkoutLog` en la respuesta es `{ id, performedAt, snapshot }`. No hay edición ni borrado (RN-001).

El `snapshot` lo arma el backend leyendo el estado actual del `Day` —que ya es la copia vigente (RN-002)—, y **sí incluye el nombre resuelto de cada ejercicio y su equipamiento**, congelados:

```json
{
  "routineName": "...",
  "day": { "order": 0 },
  "blocks": [
    {
      "name": "...",
      "type": "...",
      "timerConfig": { },
      "advanceMode": "...",
      "exercises": [
        {
          "name": "...",
          "order": 0,
          "reps": 12,
          "duration": 60,
          "equipmentGroups": [["kettlebell", "mancuernas"]]
        }
      ]
    }
  ]
}
```

En el snapshot `equipmentGroups` es también `string[][]`, pero con los **nombres** de los elementos, no sus IDs: se congelan por valor (RN-015).

| Código | Status | Cuándo |
|---|---|---|
| `ROUTINE_NOT_FOUND` | 404 | La rutina no existe o está borrada |
| `DAY_NOT_FOUND` | 404 | El día no existe o no pertenece a esa rutina |

### Notas transversales de implementación

No están en los docs cerrados; son decisiones que tomó el backend:

- **El `order` nunca viaja en el body.** El de días, bloques y ejercicios se infiere de la posición en el array recibido.
- **Editar es reemplazar.** Tanto `PATCH /blocks/:id` como `PUT /routines/:id` borran y recrean lo anidado dentro de una transacción, en vez de aplicar un patch parcial.
- **La unicidad de nombre (RN-005) se valida en la aplicación** (find-then-write), no con un constraint de base, porque tiene que excluir los registros borrados lógicamente.
- **Las respuestas incluyen campos internos de Prisma** que `data-model.md` no lista (`id` y FKs como `blockId` o `dayBlockId` en las filas anidadas). Son aditivos e inofensivos; el frontend los ignora.

## Módulos de dominio

### Ejercicios

`src/exercises`. CRUD del pool de ejercicios (RF-001). Aplica RN-005 al crear y renombrar, RN-008 en el borrado y RN-007 en el bloqueo del borrado: consulta `BlockExercise` y `DayBlockExercise` antes de borrar y corta con `EXERCISE_IN_USE` si hay alguna referencia.

También es el dueño de los grupos de equipo del ejercicio (RF-017, `data-model.md` §2.3): valida cada `equipmentId` recibido contra el pool de `Equipment` —mismo criterio con el que rutinas valida `exerciseId`— y corta con `EQUIPMENT_NOT_FOUND`. Al editar aplica **reemplazo completo** del conjunto de grupos.

RN-014 la sostiene el DTO, con un validador custom de `class-validator` que rechaza los grupos vacíos: sale como `VALIDATION_ERROR`, no como un código de dominio propio.

### Equipamiento

`src/equipment`. CRUD del pool de elementos (RF-016). Aplica RN-005 al crear y renombrar, RN-008 en el borrado y RN-013 en el bloqueo del borrado: corta con `EQUIPMENT_IN_USE` si algún `EquipmentGroupItem` lo referencia.

### Bloques

`src/blocks`. CRUD del pool de bloques (RF-002, RF-003). Valida el `timerConfig` contra el `type` del bloque y los tiempos y repeticiones positivos (RN-006), más RN-005 y RN-008. No aplica bloqueo de borrado: los bloques del pool no tienen referencias vivas (RN-002).

### Rutinas

`src/routines`. CRUD de rutinas con su árbol completo de días y bloques copiados (RF-004, RF-005, RF-006). Materializa RN-002 y RN-003: los bloques que llegan en el body se persisten como `DayBlock` / `DayBlockExercise` propios de la rutina, sin vínculo con el pool, y el único vínculo vivo que queda es el `exerciseId` de cada ejercicio —que el módulo valida contra el pool (`EXERCISE_NOT_FOUND`) y que sostiene RN-007—. Aplica RN-005 sobre el nombre de la rutina y RN-008 en el borrado.

### Historial

`src/workout-logs`. Crea el registro de una ejecución terminada (RF-013) y lista el historial (RF-014). Construye el snapshot inmutable de RN-001 a partir del `Day` y resuelve ahí los nombres de los ejercicios y de su equipamiento (RN-015), de modo que el registro no conserve ninguna referencia editable (`data-model.md` §2.9). No expone edición ni borrado. La agrupación por día y semana (RN-012) se deriva de `performedAt` en el frontend; el backend solo ordena descendente.

## Semilla

Qué debe existir está en `docs/requirements.md` §6; acá va cómo se carga.

- **Script:** `backend/prisma/seed.ts`. Se corre con `prisma db seed`, declarado en `prisma.config.ts` como `migrations.seed: "ts-node prisma/seed.ts"`.
- **Idempotente:** si ya existe una rutina `Plan semanal` no borrada, no hace nada. Correrlo dos veces no duplica.
- **Qué carga:** los 4 elementos, los 15 ejercicios con sus grupos de equipo —incluido el grupo alternativo de *remos* {kettlebell, mancuernas}—, los 8 bloques del pool y la rutina `Plan semanal` de 5 días de `docs/requirements.md` §6.1.

## Testing

Jest, TDD estricto (`docs/technical.md` §Testing). Acá van las convenciones propias del backend: fixtures, base de test y qué se testea a qué nivel.

- **Jest**, el default de NestJS.
- Cubiertos por tests unitarios escritos antes que la implementación: el filtro de excepciones, el interceptor de respuesta y el middleware de logging.
- Hay un **test e2e mínimo que corre sin una Postgres levantada**: la conexión de Prisma es perezosa y no se abre al arrancar el módulo (ver Gotchas).

## Gotchas

- **El generador de Prisma es `prisma-client-js`, el clásico, a propósito.** El generador nuevo por defecto (`provider = "prisma-client"`, ESM) emite código con `import.meta.url`, que rompe bajo Jest/CommonJS. Cambiarlo exige migrar todo el proyecto a ESM.
- **Prisma está fijado en 6.19.3.** `prisma init` instala por defecto una release candidate de la 8.x; no se usa.
- **`PrismaService` no conecta en `onModuleInit`.** Se apoya en la conexión perezosa de Prisma para que la app y los tests arranquen sin una Postgres real corriendo. Solo desconecta prolijamente en `onModuleDestroy`.
- **Códigos de error de dominio.** Si una excepción de negocio declara su propio `code` en el constructor, el filtro global lo respeta tal cual; si no lo declara, el filtro deriva un código genérico a partir del status HTTP. Los mensajes de `class-validator` se agrupan bajo el código `VALIDATION_ERROR`.
