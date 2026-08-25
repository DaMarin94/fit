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

Entidades materializadas: `Exercise`, `Block` + `BlockExercise`, `Routine`, `Day` + `DayBlock` + `DayBlockExercise`, y `WorkoutLog`.

- **`DayBlock` y `DayBlockExercise` son nombres internos del schema**, no aparecen en `data-model.md`: son las dos tablas que materializan los *bloques copiados* de un día (`data-model.md` §2.8), es decir el snapshot independiente del pool que exigen RN-002 y RN-003.
- **IDs:** todas las entidades usan `String @id @default(cuid())`. `data-model.md` habla de "ID técnico" sin fijar formato; el formato concreto se decide acá.
- **`Equipment` y los grupos de equipo (`data-model.md` §2.1 y §2.3) no existen todavía** en el schema, ni el campo `equipmentGroups` de `Exercise`. Entran con su propia migración (`roadmap.md` §Fase 2).

## Endpoints

Rutas, bodies, respuestas y códigos de error. El envoltorio común está en `docs/data-model.md` §4.

El envoltorio ya está implementado y verificado en código, en las dos formas: `{ data }` en éxito y `{ error: { message, code } }` en error. **No hay todavía endpoints de dominio.**

## Módulos de dominio

### Ejercicios

_Sin contenido todavía._

### Bloques

_Sin contenido todavía._

### Rutinas

_Sin contenido todavía._

### Historial

_Sin contenido todavía._

## Semilla

Qué debe existir está en `docs/requirements.md` §6; acá va cómo se carga.

_Sin contenido todavía._

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
