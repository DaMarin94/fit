# Estándares transversales — Fit

Reglas que aplican a todo el código, en las dos capas. Se leen **antes** de implementar: si un patrón ya vive acá, no se re-inventa. Si una decisión técnica nueva no está cubierta, se reporta al orquestador antes de inventarla.

El stack y las decisiones estructurales están en `docs/architecture.md`; los contratos y shapes, en `docs/data-model.md`.

---

## 1. Forma de las respuestas

Definida en `docs/data-model.md` §4. En resumen: éxito devuelve el recurso o `{ data }`; error devuelve `{ error: { message, code } }`; fechas en ISO 8601; sin paginación en v1.

---

## 2. Errores

### 2.1 Backend

- **Un exception filter global de NestJS** es el único productor de respuestas de error. Ningún controller ni service arma su propia forma de error.
- Toda respuesta de error sale con la forma `{ error: { message, code } }`.
- `message` está escrito para el usuario final: dice qué pasó y qué hacer, sin códigos ni jerga. `code` es el identificador estable que consume el frontend.

### 2.2 Frontend

- **Una capa centralizada de llamadas HTTP** (wrapper con interceptor) es el único punto por el que salen los requests. Ningún componente llama `fetch` directo.
- El interceptor detecta la forma de error y la muestra como **toast**. Los componentes no repiten manejo de error genérico.
- El llamador puede pedir el request en modo **`silent`** para los caminos donde la app se degrada con gracia y el usuario no pierde nada (cache offline, cola de sincronización): el error se propaga igual, solo se omite el aviso automático. Avisar ahí sería reportar como falla algo que en los hechos no rompió nada.
- El manejo específico (por ejemplo, marcar un campo del formulario a partir de un `code`) se hace en el componente, sobre el error que la capa le devuelve.

---

## 3. Validación

| Capa | Herramienta | Alcance |
|---|---|---|
| Backend | `class-validator` en los DTOs de NestJS | Toda entrada de la API. Es la validación autoritativa |
| Frontend | **Zod** | Validación de formularios antes de enviar. Es feedback temprano, no reemplaza la del backend |

Las reglas concretas que se validan (nombres únicos, tiempos y reps positivos, borrado bloqueado) son de negocio y viven en `docs/requirements.md` §4.

---

## 4. Logging (backend)

Nivel básico, sin infraestructura de observabilidad:

- Se loguea **método, ruta y status** de cada request.
- Se loguean los **errores con stack trace**.
- **Nunca se loguean bodies completos ni credenciales.** v1 no tiene credenciales, pero la convención rige igual para cuando existan.

---

## 5. Testing

- **TDD estricto, sin excepción** (RNF-001): el test se escribe **antes** que el código, en frontend y en backend. No hay "después le agrego los tests".
- Todo feature se entrega con sus tests en el mismo commit.

| Capa | Framework |
|---|---|
| Backend | **Jest** (default de NestJS) |
| Frontend | **Vitest + React Testing Library** |

**Sin CI configurado**: el proyecto corre solo en local y los tests se corren a mano. Cuando se agregue CI, el estándar a aplicar es correr build y suite completa de las dos capas en cada push.

---

## 6. Variables de entorno y secretos

- **Un `.env` por carpeta:** `/frontend/.env` y `/backend/.env`. No hay `.env` en la raíz del monorepo.
- Cada carpeta versiona su **`.env.example`** documentando todas las claves, con los valores vacíos o de ejemplo. Nunca valores reales.
- Los `.env` reales no se versionan.

---

## 7. Migraciones y semilla

- **Prisma** es el único mecanismo de cambio de schema. Las migraciones se generan y aplican con `prisma migrate dev`, **corridas manualmente** por el desarrollador. No hay migración automática al arrancar.
- **La semilla carga los datos de ejemplo** del plan de referencia: ejercicios y bloques del pool, y una rutina de ejemplo que los encadena. Qué debe existir exactamente está en `docs/requirements.md` §6.
- La base local de desarrollo es descartable: su data no tiene valor (ver `docs/qa-visual.md`).

---

## 8. Offline y sincronización

Requisito de negocio en RN-004; decisión estructural en `docs/architecture.md` §Offline.

- El **frontend** es el dueño del comportamiento offline: cachea localmente lo necesario para que Modo entrenar y el timer funcionen sin conexión.
- El **timer nunca depende de la red**: no consulta al backend para contar, avanzar ni avisar transiciones.
- Al recuperar la conexión, el frontend sincroniza con el backend lo que quedó pendiente.
- El backend no tiene lógica de offline: recibe la sincronización como escrituras normales.

---

## 9. Deploy

**No hay.** La app corre solo en el entorno local del desarrollador (RNF-002): frontend en `3000`, backend en `3001`, PostgreSQL en `5432`.
