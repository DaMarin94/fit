# Requerimientos — Fit

Destino canónico de toda regla funcional del proyecto. Los contratos y shapes viven en `docs/data-model.md`; el detalle de cada pantalla, en `docs/screens.md`; los estándares transversales, en `docs/technical.md`.

---

## 1. Producto

**Fit** es una app personal para armar rutinas de entrenamiento y ejecutarlas en tiempo real con un timer integrado (EMOM, AMRAP, intervalos work/rest, timer libre). Un solo usuario, sin login.

### 1.1 Qué NO es — límites duros permanentes

No son alcance de ninguna versión. No se proponen, no se discuten, no se agregan "chiquito":

| Límite | Qué queda excluido |
|---|---|
| **No es red social fitness** | Feed, seguidores, likes, comentarios, compartir, rankings, comparaciones. Ninguna superficie implica a otra persona |
| **No es tracker nutricional** | Comidas, calorías, macros, peso corporal como objetivo nutricional |
| **No es plataforma de coaching / marketplace** | Entrenadores, clientes, planes vendidos, suscripciones |
| **No integra wearables** | Pulsómetros, relojes, sensores, importación de datos de terceros |

### 1.2 Flujo core

Crear una rutina → abrirla en Modo entrenar → el timer corre siguiendo la estructura de la rutina → el usuario termina el entrenamiento.

Si ese flujo no funciona, el producto no existe. Toda decisión se juzga contra él.

---

## 2. Alcance de v1

### 2.1 Dentro

- Crear y editar rutinas.
- Pool reutilizable de bloques de entrenamiento y de ejercicios (biblioteca).
- Ejecutar una rutina en Modo entrenar con timer en vivo.
- Historial básico de entrenamientos realizados.

### 2.2 Fuera de v1 — "todavía no"

No son límites permanentes; son alcance de una versión futura:

- Login, autenticación y multi-usuario.
- Campos de auditoría (`createdAt` / `updatedAt`) en las entidades.

### 2.3 Definición de "v1 terminada"

1. Los cuatro tipos de timer cuentan bien y avisan las transiciones sin fallar.
2. El historial básico es visible: lista con fecha + rutina.
3. Modo entrenar es cómodo de usar en el celular durante el entrenamiento.

---

## 3. Requerimientos funcionales (RF)

### 3.1 Pool (biblioteca)

| ID | Requerimiento |
|---|---|
| **RF-001** | El usuario crea, edita, lista y borra **ejercicios** en el pool reutilizable. Un ejercicio es reutilizable por cualquier bloque |
| **RF-002** | El usuario crea, edita, lista y borra **bloques** en el pool reutilizable. Un bloque tiene un tipo, su configuración de timer, una lista ordenada de ejercicios con reps/tiempo, y su configuración de avance |
| **RF-003** | Los tipos de bloque son una **lista cerrada y ampliable**: `fuerza` (EMOM), `metcon` (AMRAP), `intervalos` (work/rest configurable), `cardio_libre` (fases de tiempo sin reps). Cada tipo determina el timer que corre en Modo entrenar |
| **RF-016** | El usuario crea, edita, lista y borra **elementos** (equipamiento: kettlebell, mancuernas, soga, silla) en un pool reutilizable propio, con el mismo patrón que ejercicios y bloques |
| **RF-017** | Cada ejercicio declara **cero o más grupos de equipo**. Un grupo lista elementos **alternativos entre sí** (cualquiera sirve); el ejercicio necesita satisfacer **todos** sus grupos. Un grupo de un solo elemento es un requisito fijo. Cero grupos significa que se hace sin equipo (peso corporal); no existe un elemento especial para representarlo |
| **RF-018** | El usuario **filtra el pool de ejercicios por elemento**, para ver solo los que pueden hacerse con un elemento determinado —los que lo listan en alguno de sus grupos— o solo los que no necesitan ninguno |

### 3.2 Rutinas

| ID | Requerimiento |
|---|---|
| **RF-004** | El usuario crea, edita, lista y borra **rutinas**. Una rutina tiene un nombre y una o más **días** |
| **RF-005** | Una rutina tiene **estructura libre**: uno o más días, cada día con una lista ordenada de uno o más bloques que se ejecutan encadenados (ej. Fuerza seguido de Metcon). El usuario ordena días y bloques |
| **RF-006** | Al armar un día, el usuario agrega bloques de dos maneras: (a) eligiendo uno del pool, que se **copia** a la rutina (RN-002), o (b) creando uno **ad-hoc** ahí mismo, que no se guarda en el pool (RN-003) |

### 3.3 Modo entrenar

| ID | Requerimiento |
|---|---|
| **RF-007** | El usuario inicia Modo entrenar sobre un día de una rutina. El timer recorre los bloques de ese día en orden |
| **RF-008** | El timer soporta los cuatro tipos: **EMOM** (cada minuto arranca una tarea; el resto del minuto es descanso), **AMRAP** (máxima cantidad de rondas de la lista en X minutos), **intervalos** (tiempo de trabajo y tiempo de descanso configurables, repetidos por N rondas), **timer libre** (fases de duración sin reps, ej. trote) |
| **RF-009** | El timer **avisa las transiciones** (cambio de fase, de ejercicio, de ronda y de bloque) |
| **RF-010** | Durante la ejecución el usuario puede **pausar, reanudar y avanzar** al siguiente paso |
| **RF-011** | El avance de un bloque al siguiente se comporta según la configuración del bloque: automático o manual (RN-009) |
| **RF-012** | El usuario **termina el entrenamiento**, y al terminarse se registra en el historial (RF-013) |

### 3.4 Historial

| ID | Requerimiento |
|---|---|
| **RF-013** | Al terminar un entrenamiento se guarda un registro de historial con la fecha y el **snapshot completo** de lo realizado (RN-001) |
| **RF-014** | El usuario consulta el historial como una lista de entrenamientos realizados, agrupada por semana y por día calendario (RN-012). Cada entrada muestra la fecha y la rutina, y permite ver el snapshot de lo que se hizo |

### 3.5 Transversales de producto

| ID | Requerimiento |
|---|---|
| **RF-015** | El usuario alterna entre tema claro y oscuro con un toggle explícito (RN-011) |

---

## 4. Reglas de negocio (RN)

| ID | Regla |
|---|---|
| **RN-001** | **El historial es una foto inmutable.** Un registro de historial guarda la estructura completa de lo realizado congelada al momento de terminar el entrenamiento. Editar o borrar después un ejercicio, un bloque o una rutina **no altera** ningún registro de historial ya guardado |
| **RN-002** | **Los bloques se copian, no se referencian.** Un bloque del pool agregado a una rutina queda como copia propia de esa rutina. Editar después el bloque en el pool **no afecta** las rutinas que ya lo usan; editar la copia dentro de la rutina **no afecta** al bloque del pool |
| **RN-003** | **Un bloque de una rutina puede ser ad-hoc.** Se crea directamente dentro de esa rutina, sin guardarse en el pool, y solo existe ahí |
| **RN-004** | **Offline-first obligatorio.** Modo entrenar y el timer funcionan sin conexión a internet, apoyados en cache local del frontend. Al recuperar la conexión, la app sincroniza con el backend |
| **RN-005** | **Nombres únicos por tipo de entidad.** Los nombres de rutina, de bloque, de ejercicio y de elemento son únicos dentro de su propio espacio de nombres. Una rutina y un bloque pueden llamarse igual entre sí; dos bloques, no |
| **RN-006** | **Tiempos y repeticiones son positivos.** Ningún tiempo ni cantidad de repeticiones de un ejercicio puede ser cero ni negativo |
| **RN-007** | **No se borra un ejercicio en uso.** Si un ejercicio está referenciado por algún bloque, el borrado se bloquea con un mensaje que lo explica. Hay que sacarlo del bloque primero |
| **RN-008** | **Borrado lógico únicamente.** Rutinas, bloques, ejercicios y elementos se borran de forma lógica (soft delete). No hay borrado físico en v1 |
| **RN-009** | **El avance entre bloques es configurable.** Cada bloque define si el siguiente arranca **automático** (al terminar su tiempo) o **manual** (el usuario confirma para continuar). No hay un comportamiento único fijo |
| **RN-010** | **Salir con el timer corriendo pide confirmación.** Si el usuario intenta abandonar Modo entrenar mientras el timer está corriendo (por ejemplo tocando otro tab de navegación), la app pide confirmación explícita y avisa que se pierde el progreso |
| **RN-011** | **El tema sigue al sistema, hasta que el usuario decida.** La primera vez, el tema claro/oscuro sigue la preferencia del sistema operativo. Si el usuario cambia el toggle manualmente, esa preferencia se guarda y prevalece sobre el sistema de ahí en adelante |
| **RN-012** | **El historial se agrupa por día calendario y por semana.** El día calendario se determina con la hora local del dispositivo. La semana va de **lunes a domingo**, igual que el plan semanal |
| **RN-013** | **No se borra un elemento en uso.** Si un elemento aparece en algún grupo de equipo de algún ejercicio, el borrado se bloquea con un mensaje que lo explica. Hay que sacarlo del ejercicio primero. Mismo criterio que RN-007 |
| **RN-014** | **Un grupo de equipo tiene al menos un elemento.** No se puede guardar un ejercicio con un grupo vacío: o el grupo tiene elementos, o no existe. Un ejercicio sin equipo simplemente no declara grupos. Un mismo elemento **puede** repetirse en dos grupos distintos del mismo ejercicio: no hay restricción de unicidad entre grupos |
| **RN-015** | **El historial congela el equipamiento.** El snapshot de un entrenamiento guarda, por cada ejercicio, los grupos de equipo que tenía en ese momento, con los nombres de los elementos por valor. Renombrar o borrar un elemento después no altera el historial (caso particular de RN-001) |

---

## 5. Requerimientos no funcionales (RNF)

| ID | Requerimiento |
|---|---|
| **RNF-001** | **TDD estricto.** Todo código nuevo, en frontend y en backend, se escribe test-first. Sin excepción (`docs/technical.md` §Testing) |
| **RNF-002** | **Solo local.** La app corre en el entorno local del desarrollador. No hay deploy a internet en v1 |
| **RNF-003** | **Modo entrenar usable durante el entrenamiento**, en el celular, de pie y en movimiento. Es el criterio de aceptación de la pantalla (`docs/design.md`) |
| **RNF-004** | **Funcionamiento sin red en Modo entrenar** (implementación de RN-004): el timer no depende de latencia ni de disponibilidad del backend |

---

## 6. Datos iniciales (seed)

La app **no arranca vacía**. La semilla carga como datos de ejemplo el plan semanal de referencia del proyecto, convertido en tres cosas: ejercicios del pool, bloques del pool, y una rutina de ejemplo que los encadena. La carga técnica es responsabilidad del backend (`docs/technical.md` §Migraciones y semilla).

### 6.1 Qué debe existir

**Elementos en el pool** — los que el plan menciona textualmente: kettlebell, mancuernas, soga, silla.

**Ejercicios en el pool** — uno por cada movimiento del plan, con sus grupos de equipo (RF-017; sin grupos = peso corporal):

| Ejercicio | Grupos de equipo |
|---|---|
| goblet squats con kettlebell | {kettlebell} |
| zancadas con mancuernas | {mancuernas} |
| swings con kettlebell | {kettlebell} |
| sentadillas con kettlebell | {kettlebell} |
| shoulder press con mancuernas | {mancuernas} |
| saltos con soga | {soga} |
| dips en silla | {silla} |
| remos | **{kettlebell, mancuernas}** — grupo alternativo: sirve cualquiera de los dos |
| burpees | — |
| sit ups | — |
| push ups | — |
| jumping jacks | — |
| plancha | — |
| trote suave | — |
| trote a ritmo constante | — |

El plan de referencia nombra un mismo movimiento de dos maneras en distintos días. En el pool cada movimiento es **un solo ejercicio**: "saltos simples" y "saltos con soga" son el mismo ejercicio (*saltos con soga*); "zancadas con mancuernas" y "estocadas" son el mismo ejercicio (*zancadas con mancuernas*).

**Bloques en el pool** — uno por cada bloque del plan:

| Bloque | Tipo | Configuración de timer | Ejercicios |
|---|---|---|---|
| Fuerza EMOM 12' | `fuerza` | 12 minutos, 4 rondas de 3 minutos | 12 goblet squats · 10 zancadas por pierna · 12 swings |
| Metcon AMRAP 6' | `metcon` | 6 minutos | 20 saltos con soga · 10 burpees · 10 sit ups |
| Fuerza EMOM 10' | `fuerza` | 10 minutos, 5 rondas de 2 minutos | 12 push ups · 10 shoulder press |
| Metcon intervalos 30/15 | `intervalos` | 30" trabajo / 15" descanso, 2 rondas de 4 ejercicios | jumping jacks · swings · burpees · plancha |
| Fuerza AMRAP 12' | `metcon` | 12 minutos | 8 sentadillas con kettlebell · 10 remos · 8 dips en silla · 6 burpees |
| Finisher 3' | `metcon` | 3 minutos | 30 saltos con soga · 10 swings |
| Metabólico largo 15' | `metcon` | 15 minutos | 30 saltos con soga · 20 zancadas con mancuernas · 15 swings · 10 burpees · 5 push ups |
| Trote | `cardio_libre` | 3 fases consecutivas | trote suave 5' · trote a ritmo constante 15' · trote suave 2' |

El **nombre de un bloque es una etiqueta y el tipo es un dato aparte**: el plan llama "Fuerza" a un bloque de 12 minutos AMRAP, y en el modelo ese bloque es de tipo `metcon` porque su timer es AMRAP. El tipo lo determina el timer, no el nombre.

**Rutina de ejemplo** — una rutina con cinco días, cada uno con sus bloques **copiados** del pool (RN-002), en orden:

| Día | Bloques encadenados |
|---|---|
| Día 1 | Fuerza EMOM 12' → Metcon AMRAP 6' |
| Día 2 | Fuerza EMOM 10' → Metcon intervalos 30/15 |
| Día 3 | Fuerza AMRAP 12' → Finisher 3' |
| Día 4 | Metabólico largo 15' |
| Día 5 | Trote |

### 6.2 Qué del plan de referencia no se modela

El plan de referencia tiene anotaciones que **no tienen representación en el modelo de v1** y no se cargan: el "día opcional 6" (repetir el día 2) y las variantes reducidas del plan ("si solo hacés 3 días: día 1 + 2 + 4"). No existe el concepto de día opcional ni de variante de plan.

### 6.3 Rangos del plan de referencia

El modelo guarda **un valor único y positivo** por ejercicio (RN-006): no hay soporte para rangos de repeticiones ni de tiempo. Donde el plan de referencia expresa un rango, la semilla toma **el valor más alto**: "10 a 12 push ups" → 12 repeticiones; "10 a 15 min a ritmo constante" → 15 minutos.

