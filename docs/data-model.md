# Modelo de datos — Fit

Destino canónico de las entidades, los shapes de request/response y los contratos de API. Las reglas funcionales que gobiernan estos datos viven en `docs/requirements.md` (RF / RN) y no se repiten acá.

---

## 1. Principios del modelo

- **La identidad es siempre un ID técnico interno.** El nombre es una etiqueta única (RN-005), nunca la identidad. Renombrar no rompe referencias.
- **Borrado lógico** (RN-008) para `Equipment`, `Exercise`, `Block` y `Routine`. Toda consulta de listado excluye los borrados.
- **Sin campos de auditoría** (`createdAt` / `updatedAt`) en v1. No agregarlos.
- **Sin entidad de usuario ni scoping por usuario** en v1. No hay `userId` en ninguna tabla. Multi-usuario es una decisión de arquitectura futura y no se anticipa acá.
- **Dos entidades son snapshots, no referencias:** los bloques copiados dentro de una rutina (RN-002) y los registros de historial (RN-001).

---

## 2. Entidades

### 2.1 Equipment — elemento

Equipamiento físico que hace falta para hacer un ejercicio (kettlebell, mancuernas, soga, silla). Pool reutilizable propio, con el mismo patrón que `Exercise` y `Block`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `name` | texto | Único entre elementos no borrados (RN-005) |
| `deletedAt` | fecha ISO 8601 \| null | Borrado lógico (RN-008) |

### 2.2 Exercise — ejercicio

Movimiento reutilizable del pool.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `name` | texto | Único entre ejercicios no borrados (RN-005) |
| `equipmentGroups` | lista de `EquipmentGroup` | Cero o más, sin orden significativo (§2.3) |
| `deletedAt` | fecha ISO 8601 \| null | Borrado lógico (RN-008) |

Un `Exercise` no lleva reps ni tiempo: esos valores dependen del bloque que lo usa y viven en `BlockExercise`.

### 2.3 Exercise ↔ Equipment — grupos de equipo

El equipamiento de un ejercicio **no es una lista plana de elementos, sino una lista de grupos**. Cada grupo es un conjunto de elementos **alternativos** entre sí.

| Concepto | Regla |
|---|---|
| **Dentro de un grupo** | **O.** Cualquiera de sus elementos sirve. "remos" con el grupo {kettlebell, mancuernas} se hace con uno o con el otro |
| **Entre grupos** | **Y.** El ejercicio requiere satisfacer **todos** sus grupos. Un ejercicio con {mancuernas} y {banco} necesita las dos cosas |
| **Grupo de un solo elemento** | Es el caso normal: un requisito fijo, sin alternativa |
| **Cero grupos** | Sin equipo (peso corporal). No existe un `Equipment` especial "bodyweight" ni un flag: la ausencia ya lo representa (RF-017) |

Un `EquipmentGroup` es una estructura auxiliar, no una entidad del pool: **no tiene nombre ni identidad propia reutilizable**, existe solo dentro del ejercicio que lo declara. Contiene **uno o más** `Equipment` (RN-014); un grupo vacío no es representable.

Un mismo `Equipment` puede aparecer en grupos de muchos ejercicios: la relación `Exercise` ↔ `Equipment`, atravesando los grupos, sigue siendo **muchos a muchos**.

- La referencia desde cualquier grupo es lo que **bloquea el borrado** del elemento (RN-013), igual que `BlockExercise` bloquea el borrado del ejercicio (RN-007).
- **Ni `Block` ni `Routine` declaran equipamiento propio.** Si hace falta mostrar el equipo agregado de un bloque, un día o una rutina, se **deriva** de los ejercicios que contiene. Es presentación, no dato persistido.
- Los **bloques copiados** dentro de una rutina no congelan el equipamiento: llegan a él por el `exerciseId` que conservan (§2.8). El `WorkoutLog` sí lo congela (§2.9).

### 2.4 Block — bloque de entrenamiento

Unidad de entrenamiento con su propio timer. Vive en el pool, o existe ad-hoc dentro de una rutina (RN-003).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `name` | texto | Único entre bloques no borrados (RN-005) |
| `type` | enum | `fuerza` \| `metcon` \| `intervalos` \| `cardio_libre` — lista cerrada y ampliable (RF-003) |
| `timerConfig` | objeto | Depende de `type` (§2.5) |
| `advanceMode` | enum | `automatico` \| `manual` (RN-009) |
| `exercises` | lista ordenada de `BlockExercise` | El orden es significativo |
| `deletedAt` | fecha ISO 8601 \| null | Borrado lógico (RN-008) |

El **nombre no determina el tipo**: el tipo lo determina el timer que corre. Un bloque llamado "Fuerza" puede ser de tipo `metcon` si su timer es AMRAP.

### 2.5 Configuración de timer por tipo de bloque

Cada tipo tiene su propia forma de `timerConfig`. La relación tipo → timer es fija:

| `type` | Timer | Campos de `timerConfig` |
|---|---|---|
| `fuerza` | EMOM | Duración total y duración del intervalo por tarea |
| `metcon` | AMRAP | Duración total |
| `intervalos` | Work/rest | Tiempo de trabajo, tiempo de descanso, cantidad de rondas |
| `cardio_libre` | Libre / cronómetro | Sin campos propios (`timerConfig` vacío) — las fases son la lista ordenada de ejercicios del bloque, cada una con su `duration` (§2.6) |

Todos los tiempos y cantidades son positivos (RN-006).

### 2.6 BlockExercise — ejercicio dentro de un bloque

Asocia un `Exercise` a un `Block` con su configuración de esfuerzo y su posición.

| Campo | Tipo | Notas |
|---|---|---|
| `exerciseId` | ID técnico | Referencia al `Exercise` del pool. Bloquea su borrado (RN-007) |
| `order` | entero | Posición dentro del bloque |
| `reps` | entero \| null | Repeticiones. Positivo si está presente (RN-006) |
| `duration` | segundos \| null | Duración. Positiva si está presente (RN-006) |

Los bloques de tipo `cardio_libre` usan fases sin repeticiones: sus entradas llevan `duration` y no `reps`.

### 2.7 Routine — rutina

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `name` | texto | Único entre rutinas no borradas (RN-005) |
| `days` | lista ordenada de `Day` | Una o más. Estructura libre (RF-005) |
| `deletedAt` | fecha ISO 8601 \| null | Borrado lógico (RN-008) |

### 2.8 Day — día de rutina

Pertenece a una `Routine`. Es la unidad que se ejecuta en Modo entrenar.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `routineId` | ID técnico | Dueño |
| `order` | entero | Posición dentro de la rutina |
| `blocks` | lista ordenada de bloques copiados | Uno o más, encadenados |

**Los bloques de un `Day` son copias, no referencias** (RN-002). Cada uno guarda su propio `name`, `type`, `timerConfig`, `advanceMode` y su lista de ejercicios con reps/tiempo, congelados al momento de agregarse. Un bloque copiado puede provenir del pool o haberse creado ad-hoc (RN-003); una vez dentro del día, ambos casos son indistinguibles y se editan igual.

Los ejercicios dentro de un bloque copiado **sí** siguen referenciando al `Exercise` del pool por `exerciseId`: ese vínculo es lo que sostiene el bloqueo de borrado de RN-007.

### 2.9 WorkoutLog — registro de historial

Snapshot inmutable de una ejecución completa (RN-001).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | ID técnico | Identidad |
| `performedAt` | fecha-hora ISO 8601 | Momento del entrenamiento |
| `snapshot` | estructura congelada | Todo lo realizado: nombre de la rutina, día ejecutado, y sus bloques con tipo, configuración de timer y ejercicios con reps/tiempo y equipamiento |

Cada ejercicio del snapshot congela **su nombre y sus grupos de equipo tal como estaban al momento de entrenar**, con los nombres de los elementos por valor. Un grupo de alternativas (§2.3) se preserva como tal: el historial recuerda que ese día el ejercicio admitía kettlebell o mancuernas, no solo que "usaba equipo".

**No guarda ninguna referencia editable** a `Routine`, `Day`, `Block`, `Exercise` ni `Equipment`. Ni siquiera por ID resoluble: los nombres y valores viven dentro del snapshot. Es lo que garantiza que borrar o editar cualquier entidad —incluido renombrar o borrar un elemento— no altere el historial.

**Sin borrado lógico:** un `WorkoutLog` no se borra ni se edita.

**Agrupación** (RN-012): el día calendario y la semana lunes-domingo se **derivan** de `performedAt` con la hora local del dispositivo. No se persisten como campos.

---

## 3. Relaciones

```
Exercise (pool) ──declara 0..n──► EquipmentGroup ──alternativas 1..n──► Equipment (pool)
      ▲
      │ referenciado por
BlockExercise ◄──contiene (ordenado)── Block (pool) ──copiado a──► bloque de Day
                                                                        ▲
                                                                        │ contiene (ordenado)
                                              Routine ──contiene (ordenado)──► Day

WorkoutLog  ──sin referencias──  (snapshot autocontenido)
```

- **Pool → rutina: copia.** La flecha "copiado a" es un evento puntual, no un vínculo vivo.
- **Ejecución → historial: copia.** El `WorkoutLog` no tiene ninguna flecha entrante ni saliente.
- **Las dos flechas vivas del modelo son las que bloquean borrados:** `Exercise → EquipmentGroup → Equipment` (RN-013) y `BlockExercise → Exercise` (RN-007).
- **`EquipmentGroup` no es del pool:** no se lista, no se reutiliza y no se borra por su cuenta. Vive y muere con el ejercicio que lo declara.

---

## 4. Contrato de API

### 4.1 Envoltorio de respuesta

Forma consistente para toda la API. El detalle del manejo de errores en el backend y en el frontend vive en `docs/technical.md` §Errores.

**Éxito** — el recurso directo o `{ data }`:

```json
{ "data": { "id": "...", "name": "..." } }
```

**Error** — siempre esta forma, producida por el exception filter global:

```json
{ "error": { "message": "Ya existe un ejercicio con ese nombre.", "code": "NAME_TAKEN" } }
```

- `message` es texto para el usuario, en español rioplatense, que dice qué pasó y qué hacer.
- `code` es un identificador estable que el frontend puede discriminar.

### 4.2 Convenciones

| Convención | Valor |
|---|---|
| Fechas | ISO 8601, siempre |
| Paginación | **No hay en v1.** Volumen bajo, un solo usuario: los listados devuelven todo |
| Filtro de borrados | Los listados excluyen los registros con `deletedAt` |
| Autenticación | No hay. Ningún endpoint recibe ni infiere usuario |

### 4.3 Endpoints

Las rutas concretas, sus bodies y sus códigos de error se documentan en `docs/backend.md` §Endpoints a medida que se implementan.
