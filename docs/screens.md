# Pantallas — Fit

Definición **funcional** de cada pantalla: qué muestra, qué acciones expone, a dónde lleva y qué estados tiene. El lenguaje visual (color, tipografía, tamaño, disposición) es de `docs/design.md` y no se define acá.

Las reglas de negocio que gobiernan estos comportamientos viven en `docs/requirements.md` y se referencian por ID.

---

## 1. Navegación global

Una **barra de tabs persistente** con los mismos tres destinos en toda la app. Su posición cambia según la disposición (inferior en compacta, superior en amplia; ver `docs/design.md` §Navegación), pero los ítems, su orden y sus labels no cambian nunca.

| Tab | Lleva a |
|---|---|
| Rutinas | Mis rutinas (home) |
| Pool | Pool de bloques y ejercicios |
| Historial | Historial |

El Editor de rutina y Modo entrenar **no son tabs**: se llega a ellos desde Mis rutinas.

La barra permanece visible también durante Modo entrenar. Tocar un tab con el timer corriendo dispara la confirmación de RN-010.

El **toggle de tema claro/oscuro** (RF-015, RN-011) no es un destino ni un tab: es un control cuya disponibilidad depende de la disposición (ubicación exacta en `docs/design.md` §2.2).

| Disposición | Desde dónde se cambia el tema |
|---|---|
| Amplia | Desde cualquier pantalla: el toggle acompaña a la barra de navegación superior, presente en toda la app |
| Compacta | Solo desde el header de **Mis rutinas** (home); desde el resto de las pantallas se vuelve al home para cambiarlo |

---

## 2. Mis rutinas (home)

**Propósito:** punto de entrada. Desde acá se arranca a entrenar y se administra el catálogo de rutinas.

**Contenido:** lista de las rutinas creadas (no borradas). Por cada rutina, su nombre y la cantidad de días.

**Acciones:**

| Acción | Resultado |
|---|---|
| Crear rutina | Abre el Editor de rutina en blanco |
| Entrenar | Abre Modo entrenar sobre esa rutina; si tiene más de un día, primero se elige el día |
| Editar | Abre el Editor de rutina con esa rutina cargada |
| Borrar | Pide confirmación y aplica borrado lógico (RN-008) |

**Navegación:** es el destino del tab "Rutinas". Lleva al Editor de rutina y a Modo entrenar.

**Estados:**

| Estado | Qué muestra |
|---|---|
| Cargando | Esqueleto de la lista |
| Vacío | Mensaje que explica qué es una rutina + CTA "Crear rutina" |
| Con datos | La lista |
| Error | Mensaje de error con opción de reintentar |

---

## 3. Editor de rutina

**Propósito:** armar y editar una rutina completa: sus días y los bloques encadenados de cada día.

**Contenido:**
- Nombre de la rutina, editable.
- Sus días en orden. Por cada día, la lista ordenada de sus bloques, con el nombre, el tipo y la configuración de timer de cada uno.

**Acciones:**

| Acción | Resultado |
|---|---|
| Editar el nombre de la rutina | Valida unicidad (RN-005) |
| Agregar día / borrar día / reordenar días | La rutina queda con uno o más días (RF-005) |
| Agregar bloque del pool a un día | Abre el **selector rápido** (§6); el bloque elegido se **copia** al día (RN-002) |
| Crear bloque ad-hoc en un día | Abre la edición de bloque; el bloque queda solo en esa rutina, no entra al pool (RN-003) |
| Editar un bloque del día | Edita la copia. No afecta al bloque del pool del que salió (RN-002) |
| Quitar bloque de un día / reordenar bloques | Cambia la estructura del día |
| Guardar / descartar | Descartar pide confirmación si hay cambios sin guardar |

**Validaciones al guardar:** nombres únicos (RN-005); tiempos y repeticiones positivos (RN-006). Los errores se muestran sobre el campo que los provoca.

**Navegación:** se llega desde Mis rutinas (crear o editar). Vuelve a Mis rutinas.

**Estados:** cargando (esqueleto); rutina nueva (un día vacío con CTA para agregar el primer bloque); día sin bloques (mensaje + CTA "Agregar bloque"); con datos; error de guardado (toast, sin perder lo editado).

---

## 4. Pool de bloques y ejercicios

**Propósito:** biblioteca de piezas reutilizables. Es el catálogo del que se nutren las rutinas.

**Contenido:** tres listados, **bloques**, **ejercicios** y **elementos** (no borrados). El bloque muestra nombre, tipo, configuración de timer y sus ejercicios; el ejercicio muestra su nombre y el equipo que necesita, distinguiendo los requisitos fijos de los grupos de alternativas; el elemento muestra su nombre.

**Acciones:**

| Acción | Resultado |
|---|---|
| Crear / editar ejercicio | Pantalla propia de edición: nombre y sus **grupos de equipo**, cero o más (RF-017). El usuario agrega y quita grupos, y dentro de cada grupo agrega o quita elementos alternativos con el **selector rápido** (§6). Un grupo no puede quedar vacío (RN-014). Valida nombre único (RN-005) |
| Borrar ejercicio | Si está referenciado por algún bloque, **se bloquea** con un mensaje que lo explica y dice que hay que sacarlo del bloque primero (RN-007). Si no, pide confirmación y aplica borrado lógico (RN-008) |
| Crear / editar bloque | Pantalla propia de edición: nombre, tipo, configuración de timer, ejercicios con reps/tiempo, y modo de avance (RN-009). Los ejercicios se eligen con el **selector rápido** (§6) |
| Borrar bloque | Pide confirmación y aplica borrado lógico. Las rutinas que ya lo usan **no se ven afectadas**, porque tienen su propia copia (RN-002) |
| Crear / editar elemento | Edición de nombre. Valida nombre único (RN-005) |
| Borrar elemento | Si está referenciado por algún ejercicio, **se bloquea** con un mensaje que lo explica y dice que hay que sacarlo del ejercicio primero (RN-013). Si no, pide confirmación y aplica borrado lógico (RN-008) |
| Filtrar ejercicios por elemento | Acota el listado de ejercicios a los que pueden hacerse con un elemento determinado —los que lo listan en alguno de sus grupos—, o a los que **no necesitan ninguno** (RF-018). El filtro es visible y se puede limpiar |

**Navegación:** es el destino del tab "Pool". Lleva a las pantallas de edición de ejercicio, de bloque y de elemento.

**Estados:** cargando; vacío por listado (mensaje + CTA de creación correspondiente); filtro sin resultados (mensaje + acción para limpiar el filtro); con datos; error.

> **Notas para `design`:**
> - Los tres listados conviven en una sola pantalla. Cómo se presentan (secciones, tabs internos u otra cosa) y dónde va el control de filtro son decisiones visuales, no funcionales. Si la carga de la pantalla amerita separar elementos en una superficie propia, `design` lo plantea y se reabre acá.
> - **La diferencia entre "necesita mancuernas *y* banco" y "necesita mancuernas *o* kettlebell" tiene que quedar clara sin abrir el ejercicio.** Es el criterio funcional; cómo se distingue visualmente un requisito fijo de un grupo de alternativas, al editar y en el listado, lo fija `docs/design.md` §11.

---

## 5. Modo entrenar

**Propósito:** ejecutar en vivo el día de una rutina, con el timer siguiendo su estructura. Es el flujo core del producto.

**Contenido en pantalla, mientras corre:**
- El tiempo del timer, como dato dominante.
- La fase actual y su etiqueta (trabajo / descanso / preparación / pausa).
- El ejercicio actual y sus repeticiones o duración.
- La ronda actual sobre el total, cuando el tipo de bloque tiene rondas.
- Qué bloque del día se está ejecutando y cuántos faltan.

El comportamiento del timer depende del tipo del bloque (RF-008): EMOM, AMRAP, intervalos work/rest o libre. Las transiciones de fase, ejercicio, ronda y bloque se avisan (RF-009).

**Acciones:**

| Acción | Resultado |
|---|---|
| Iniciar | Arranca el timer del primer bloque del día |
| Pausar / reanudar | Detiene y retoma la cuenta (RF-010) |
| Avanzar | Salta al siguiente paso (RF-010) |
| Continuar al siguiente bloque | Solo aparece cuando el bloque tiene avance **manual**; con avance **automático** el siguiente arranca solo (RN-009, RF-011) |
| Terminar entrenamiento | Cierra la ejecución y guarda el registro de historial (RF-012, RF-013) |
| Salir | Con el timer corriendo, **pide confirmación** y avisa que se pierde el progreso (RN-010). Aplica también al intento de salir tocando un tab de navegación |

**Comportamiento sin conexión:** la pantalla y el timer funcionan con la red caída (RN-004). El registro de historial se sincroniza al recuperar la conexión.

**Navegación:** se llega desde Mis rutinas. Al terminar, vuelve a Mis rutinas y el entrenamiento aparece en Historial.

**Nota de disposición:** es la única pantalla que usa el ancho completo en disposición amplia — se mira de lejos, apoyada en un banco durante el entrenamiento. El detalle está en `docs/design.md` §Navegación y §Contención responsive.

**Estados:**

| Estado | Qué muestra |
|---|---|
| Listo para empezar | La estructura del día que se va a ejecutar y la acción de iniciar |
| Corriendo | El timer en la fase actual |
| En pausa | El timer detenido, sin color de fase |
| Esperando confirmación de avance | Bloque terminado con avance manual, esperando al usuario |
| Terminado | Resumen de lo realizado, sin celebración |
| Sin conexión | Sigue funcionando; indica que la sincronización queda pendiente |

---

## 6. Selector rápido (componente)

**No es una pantalla:** es **un único componente** de selección rápida sobre el pool, con dos presentaciones según la disposición (hoja inferior en compacta, diálogo centrado en amplia; ver `docs/design.md`). Se documenta una sola vez porque su comportamiento funcional es el mismo en las dos.

**Propósito:** elegir rápido una pieza del pool —bloque, ejercicio o elemento— sin abandonar la pantalla en la que se está.

**Contenido:** listado del pool correspondiente según desde dónde se lo invoque, filtrable por nombre.

**Acciones:** elegir un ítem (lo agrega y cierra el selector); buscar por nombre; cerrar sin elegir.

**Se invoca desde:**

| Desde | Elige |
|---|---|
| Editor de rutina | Un bloque del pool, para copiarlo a un día |
| Edición de bloque | Un ejercicio del pool |
| Edición de ejercicio | Un elemento del pool, para agregarlo a un grupo de equipo |
| Pool (listado de ejercicios) | Un elemento, "Sin equipo" o "Todos los equipos", para filtrar el listado (RF-018). Los dos últimos son ítems sintéticos antepuestos al listado real, no elementos del pool |

**Estados:** cargando; pool vacío (mensaje + CTA que lleva a crear la pieza que falta); búsqueda sin resultados; con datos.

---

## 7. Historial

**Propósito:** ver los entrenamientos realizados.

**Contenido:** lista de registros de historial, **agrupada por semana (lunes a domingo) y dentro de cada semana por día calendario** (RN-012). La fecha la enuncia el encabezado de cada día; cada entrada muestra la rutina y la **hora**, y permite abrir el snapshot completo de lo que se hizo.

Lo que se muestra es el **snapshot congelado** (RN-001): refleja la rutina tal como era al momento de entrenarla, aunque después se haya editado o borrado.

**Acciones:** ver el detalle de un entrenamiento. **No hay edición ni borrado** de registros de historial.

**Navegación:** es el destino del tab "Historial".

**Estados:** cargando; vacío (mensaje que explica que acá aparecen los entrenamientos terminados + CTA que lleva a Mis rutinas); con datos; error.

---

## 8. Convenciones transversales

| Convención | Regla |
|---|---|
| **Modal vs. pantalla** | Modal para acciones rápidas: selección desde el pool y confirmaciones. Pantalla propia para la edición completa de una rutina, un bloque o un ejercicio |
| **Confirmación destructiva** | Toda acción destructiva (borrar, descartar cambios, salir con el timer corriendo) pide confirmación explícita, con el nombre de lo afectado en el texto |
| **Estado vacío** | Nunca mudo: mensaje que explica qué va a aparecer ahí + la acción que lo resuelve |
| **Errores** | Toast, o mensaje inline cuando el error corresponde a un campo concreto. La capa que los produce y los muestra está en `docs/technical.md` §2 |
