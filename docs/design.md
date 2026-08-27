# Diseño — Fit

Guía viva del lenguaje visual de **Fit**. Es la versión curada y vigente: ante conflicto con cualquier material crudo o con una implementación existente, manda este documento. Único escriba: el agente `design`.

**Qué es Fit, en términos de diseño:** app personal (un solo usuario) para armar rutinas y ejecutarlas en tiempo real con timer integrado (EMOM, AMRAP, work/rest, libre). Se usa **de pie, en el gimnasio, con el celular en la mano, transpirado, en movimiento y a veces a un metro de distancia**. Ese contexto de uso, y no la elegancia, es el que gana cada discusión de diseño.

---

## 1. Principios de producto (el filtro de toda decisión)

1. **Legible a un metro y de reojo.** El dato que el usuario mira mientras entrena (el timer, la fase, la ronda) se lee sin enfocar la vista. Todo lo demás es secundario por definición.
2. **Se opera con un pulgar y sin precisión.** Manos sudadas, movimiento, apuro. Targets grandes, acciones primarias abajo, nada crítico en las esquinas superiores.
3. **Durante el entrenamiento, cero decisiones.** Modo entrenar no ofrece opciones que no sean pausar, avanzar y salir. La configuración se hizo antes.
4. **La app es de una sola persona.** No existe ninguna superficie que implique a otro usuario: ni feed, ni likes, ni comparaciones, ni "compartir con".
5. **Silencio visual.** Sin decoración, sin ilustraciones de relleno, sin gradientes de adorno. El color aparece cuando significa algo.

---

## 2. Modos de color

La app soporta **modo claro y modo oscuro**, con **toggle explícito del usuario**. Ambos son ciudadanos de primera: ninguna decisión visual vale solo en uno de los dos, y todo spec declara los dos.

- El modo oscuro es el esperado en el gimnasio (luz baja, pantalla cerca de la cara, batería).
- El modo claro es el esperado al planificar rutinas (a veces con luz de día, a veces en pantalla ancha).
- **En oscuro no se usan sombras para elevar** (no se ven): la elevación se comunica subiendo la luminosidad de la superficie.
- **En claro la elevación es borde + sombra sutil**, nunca sombra sola.

### 2.1 Default y persistencia (decidido)

**El modo por defecto sigue al sistema operativo.** Mientras el usuario no toque el toggle, la app respeta `prefers-color-scheme` y cambia con él. En cuanto el usuario mueve el toggle manualmente, **esa elección se guarda y prevalece sobre el sistema de ahí en adelante**. (Regla funcional: RN-011 en `docs/requirements.md`.)

Consecuencias visuales:

- **El toggle nunca se muestra en un tercer estado "auto".** Tiene dos posiciones, claro y oscuro, y arranca reflejando lo que el sistema dictó. Un tercer estado obligaría al usuario a razonar sobre un control que se toca una vez en la vida: carga cognitiva sin beneficio.
- **El estado inicial se resuelve antes del primer pintado.** Nunca se ve un destello de modo claro antes de aplicar el oscuro. Un flash blanco a pantalla completa en un gimnasio con luz baja es un fallo visual, no un detalle.
- El cambio de modo es **instantáneo, sin transición de color** entre paletas. Una interpolación de 200ms entre dos paletas completas se ve como un glitch.

### 2.2 Dónde vive el toggle

| Disposición | Ubicación |
|---|---|
| **Amplia (≥1024px)** | Extremo derecho de la barra superior de navegación |
| **Compacta (375–1023px)** | Extremo derecho del header de **Mis rutinas** (home), como botón de ícono de 44×44px |

Por qué en compacto vive solo en el home y no en todas las pantallas:

- **No merece un slot de tab.** Los tabs son destinos, no acciones, y son un recurso escaso en 375px. Una preferencia que se toca una vez cada varios meses no compite con una pantalla.
- **No puede estar en todas las cabeceras:** los headers del Editor de rutina y del Pool ya tienen su acción contextual propia (guardar, cerrar) en esa misma esquina. Meter el toggle ahí lo pondría a competir con acciones que sí importan en ese momento.
- **Nunca aparece en Modo entrenar.** Ahí el usuario no toma decisiones que no sean pausar, avanzar y salir.
- **Misma esquina en los dos regímenes** (arriba a la derecha, mismo ícono, mismo comportamiento): el usuario que pasa de celular a desktop lo busca donde ya lo conoce.

Si en algún momento existe una pantalla de Ajustes, el toggle se muda ahí y desaparece del header del home. Hasta entonces, esta es su casa.

---

## 3. Color

### 3.1 Los cinco roles del color

Fit tiene **una sola paleta cromática y cinco roles cerrados**. No se agregan hues nuevos sin decisión explícita.

| Rol | Hue | Dónde vive | Dónde NO vive |
|---|---|---|---|
| **Neutros** | Gris frío (azulado) | Todo: fondos, superficies, bordes, texto | — |
| **Acento de marca** | Violeta eléctrico | Identidad, acción primaria, estado activo de navegación, foco | Datos, estados, fases del timer, categorías |
| **Éxito** | Verde | Confirmación de una acción que terminó bien | Cualquier otra cosa |
| **Destructivo / error** | Carmesí | Borrar, descartar, error de validación | Cualquier otra cosa |
| **Advertencia** | Ámbar | Aviso reversible ("hay cambios sin guardar") | Cualquier otra cosa |
| **Fases del timer** | Coral (trabajo) / Cian (descanso) | **Solo** Modo entrenar | Cualquier otra pantalla |

### 3.2 Por qué el acento es violeta

Es la única decisión de paleta que no está atada a un significado previo, así que se eligió por **máxima separabilidad**:

- Los tres semánticos (verde, rojo, ámbar) ocupan el arco cálido-verde del espectro. El violeta es el punto más lejano a los tres a la vez.
- Un usuario con daltonismo rojo-verde (protanopía/deuteranopía, el caso frecuente) confunde verde y rojo **entre sí**, pero no confunde ninguno de los dos con violeta. El acento nunca se va a leer como "error" ni como "éxito".
- No es el azul de sistema, así que no se lee como hipervínculo ni como cromo nativo del SO: se lee como marca.
- Rinde bien en los dos modos: en claro tiene cuerpo suficiente para texto sobre blanco; en oscuro se aclara sin desaturarse a lavanda pastel.

### 3.3 Por qué las fases del timer tienen paleta propia

La tentación obvia es "trabajo = rojo, descanso = verde". **Está prohibido**: rompería la semántica reservada justo en la pantalla donde un error de lectura cuesta caro (el usuario vería rojo y pensaría "algo falló"). Por eso las fases usan un par propio:

- **Trabajo = coral/naranja incandescente.** Cálido, urgente, empuja.
- **Descanso = cian frío.** Baja pulsaciones, se opone al coral en temperatura y en hue, y se distingue del coral incluso en escala de grises por luminosidad.
- **Preparación / pausa = neutro.** Sin color: "todavía no pasa nada" / "está detenido".

**Riesgo gestionado:** coral (fase trabajo), carmesí (destructivo) y ámbar (advertencia) son los tres cálidos y podrían confundirse. Se separan por **escala de uso, no por hue**: las fases son **la única cosa que se pinta a sangre completa** (fondo de pantalla entera), y los semánticos **nunca** se usan como superficie amplia (viven en textos, íconos, bordes, chips y toasts). Un bloque de color que ocupa la pantalla es siempre una fase; un puntito de color es siempre un semántico.

### 3.4 Tokens — modo claro

```
/* Neutros */
--bg              #F7F8FA   /* fondo de la app */
--surface         #FFFFFF   /* tarjetas, hojas, modales */
--surface-2       #F1F3F7   /* superficie hundida / secundaria */
--border          #E2E5EC   /* separadores, bordes de tarjeta */
--border-strong   #C9CEDA   /* bordes de input, divisiones fuertes */
--text            #12151C   /* texto principal */
--text-muted      #5A6273   /* texto secundario, labels */
--text-disabled   #9AA1B0   /* solo controles deshabilitados */

/* Acento de marca */
--accent          #5B45E0
--accent-hover    #4C38C4
--accent-fg       #FFFFFF   /* texto/ícono sobre relleno de acento */
--accent-tint     #EDEAFD   /* fondo suave: chip activo, fila seleccionada */

/* Semánticos */
--success         #147A46   --success-tint  #E6F5EE
--danger          #BE1F45   --danger-tint   #FBE8ED
--warning         #8A5A00   --warning-tint  #FDF3E0

/* Fases del timer (solo Modo entrenar) */
--phase-work-bg   #C4441F   --phase-work-fg   #FFFFFF
--phase-rest-bg   #0B6E93   --phase-rest-fg   #FFFFFF
--phase-idle-bg   #F1F3F7   --phase-idle-fg   #12151C
```

### 3.5 Tokens — modo oscuro

```
/* Neutros */
--bg              #0B0E14
--surface         #141922
--surface-2       #1D2430
--border          #2A3340
--border-strong   #3C4757
--text            #EDF0F5
--text-muted      #A0AABB
--text-disabled   #5D6878

/* Acento de marca */
--accent          #8B79FF
--accent-hover    #A091FF
--accent-fg       #10121A   /* texto oscuro sobre relleno de acento claro */
--accent-tint     #1E1B33

/* Semánticos */
--success         #45D18A   --success-tint  #10281D
--danger          #FF6B8A   --danger-tint   #2C1119
--warning         #F5B333   --warning-tint  #2A2008

/* Fases del timer (solo Modo entrenar) */
--phase-work-bg   #3A1408   --phase-work-fg   #FF8452
--phase-rest-bg   #08222F   --phase-rest-fg   #58C8EE
--phase-idle-bg   #1D2430   --phase-idle-fg   #EDF0F5
```

**Nota sobre la inversión de la fase en oscuro:** en claro la fase es un **relleno saturado con texto blanco**; en oscuro es una **superficie profunda teñida con numerales saturados**. Es intencional: un rectángulo coral a pantalla completa y a máximo brillo, en un gimnasio con luz baja, encandila y arruina la lectura del número. El significado ("estoy en trabajo") se conserva porque el hue es el mismo; lo que cambia es quién lleva la saturación.

### 3.6 Contraste — mínimos que se verifican

- Texto normal: **4.5:1**. Texto ≥24px o ≥19px bold: **3:1**.
- Numerales del timer: **≥7:1** contra su superficie. Es el dato que se lee de lejos y en movimiento; AA no alcanza.
- Bordes de controles interactivos y estados de foco: **≥3:1** contra el fondo adyacente.
- `--text-disabled` es la única excepción permitida al mínimo de texto, y solo en controles deshabilitados (que además comunican su estado por opacidad y cursor, no solo por color).

---

## 4. Tipografía

### 4.1 Familias

| Familia | Uso | Fallback |
|---|---|---|
| **Inter** (variable) | Toda la UI: títulos, cuerpo, labels, botones, listas | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| **JetBrains Mono** | **Obligatoria** para todo dígito que cambia en tiempo real | `ui-monospace, "SF Mono", "Roboto Mono", monospace` |

Inter se eligió por legibilidad a tamaños chicos y en pantalla sucia/con reflejo, y porque su set de numerales tabulares es completo. JetBrains Mono se eligió por dígitos anchos, altura de x grande y `0`/`8`/`6` inconfundibles a gran tamaño.

### 4.2 Regla dura — numerales del timer

**Todo dígito que cambia en tiempo real se renderiza en JetBrains Mono con `font-variant-numeric: tabular-nums`, tamaño grande y peso alto.** Aplica al reloj del timer, a la cuenta regresiva de preparación, al contador de rondas y a cualquier contador en vivo de Modo entrenar.

El motivo no es estético: con numerales proporcionales, el `1` es más angosto que el `8`, así que la cifra **se mueve de lugar cada segundo**. Un número que baila es ilegible de reojo y a un metro, que es exactamente cómo se lee. Tabular + monoespaciado congela el ancho de cada posición: el número cambia, el layout no.

Corolarios innegociables:
- El contenedor del timer **nunca** cambia de ancho ni reflows al pasar de `9:59` a `10:00`.
- Los dígitos **no** tienen animación de entrada/salida por dígito, ni transición de posición.
- Nunca se aplica `letter-spacing` negativo al timer para "que entre": si no entra, baja el tamaño en escalón completo.

### 4.3 Regla secundaria — números comparables

Todo número que se lee **en columna o en lista** (pesos, repeticiones, duraciones en el historial y en el editor) usa Inter con `tabular-nums`. No es monoespaciado, pero se alinea. Un número suelto en medio de una frase usa numerales proporcionales normales.

### 4.4 Escala

**Escala de UI (Inter):**

| Nivel | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `display` | 32 / 38 | 700 | Título de pantalla en disposición amplia |
| `h1` | 24 / 30 | 700 | Título de pantalla |
| `h2` | 20 / 26 | 600 | Título de sección, nombre de rutina en tarjeta |
| `h3` | 17 / 24 | 600 | Nombre de bloque / ejercicio |
| `body` | 16 / 24 | 400 | Cuerpo, valor de campo |
| `body-sm` | 14 / 20 | 400 | Secundario, metadatos |
| `label` | 13 / 18 | 600, `+0.02em` | Labels de formulario, encabezados de lista |
| `caption` | 12 / 16 | 500 | Marca de tiempo, contador auxiliar |

**Nunca por debajo de 12px.** Un dato que no merece 12px no merece estar en pantalla.

**Escala del timer (JetBrains Mono, 700, `tabular-nums`, `line-height: 1`):**

| Nivel | Compacto | Amplio | Uso |
|---|---|---|---|
| `timer-hero` | 88px | 140px | Reloj principal de Modo entrenar |
| `timer-lg` | 48px | 64px | Reloj secundario (tiempo total transcurrido) |
| `timer-md` | 28px | 32px | Contador de rondas, cuenta de reps en vivo |

En 375px, `timer-hero` a 88px entra cómodo con formato `MM:SS` (5 caracteres) y márgenes laterales. Si el formato necesita horas (`H:MM:SS`), baja a `timer-lg` en compacto — nunca se comprime el tracking.

**Etiqueta de fase** ("TRABAJO" / "DESCANSO" / "PREPARÁ"): Inter 20/26, 700, mayúsculas, `+0.08em`. Va **siempre** acompañando al número: la fase nunca se comunica solo por color.

---

## 5. Densidad, espaciado y forma

### 5.1 Densidad

Fit es **densidad cómoda, no compacta**. La app no muestra tablas de datos ni dashboards: muestra pocas cosas que hay que tocar rápido. El aire es funcional, no decorativo.

### 5.2 Espaciado

Escala base 4px (la de Tailwind). Se usan estos escalones y no otros: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

- Padding lateral de pantalla: **16px** en compacto, **24px** en amplio.
- Separación entre tarjetas de una lista: **12px**.
- Padding interno de tarjeta: **16px**.
- Separación entre secciones: **32px**.
- Espacio libre al final de toda pantalla scrolleable: **96px** (para que el último ítem no quede debajo de la barra de navegación ni del botón flotante).

### 5.3 Radios

`--r-sm 8px` (chips, inputs chicos) · `--r-md 12px` (botones, inputs) · `--r-lg 16px` (tarjetas, modales, hojas) · `--r-full` (avatar de ícono, chips de estado, botón circular).

El bloque del timer en Modo entrenar usa `--r-lg` o bordes rectos a sangre según ocupe tarjeta o pantalla completa; nunca radios intermedios inventados.

### 5.4 Elevación

| Nivel | Claro | Oscuro |
|---|---|---|
| Plano | `--surface` + `--border` | `--surface` |
| Elevado (tarjeta destacada, popover) | `--surface` + sombra `0 1px 3px rgba(18,21,28,.08), 0 4px 12px rgba(18,21,28,.06)` | `--surface-2`, sin sombra |
| Overlay (modal, hoja) | `--surface` + sombra `0 8px 32px rgba(18,21,28,.16)` | `--surface-2` + borde `--border` |
| Backdrop | `rgba(18,21,28,.40)` | `rgba(0,0,0,.64)` |

---

## 6. Targets, controles y estados

### 6.1 Tamaños táctiles

- **Mínimo absoluto: 44×44px** para cualquier cosa tocable, en cualquier pantalla. Si el elemento visible es más chico (un ícono de 24px), el área tocable igual mide 44×44.
- **Controles primarios de Modo entrenar: ≥64px de alto**, y el par principal (pausar/reanudar y siguiente) **≥72px**, ubicados en la **mitad inferior** de la pantalla. Se tocan con el pulgar, sin mirar, con la mano temblando.
- Separación mínima entre dos targets adyacentes: **8px**.

### 6.2 Estados obligatorios de todo control

Ningún control se considera especificado sin los siete: **reposo, hover, foco, activo/presionado, deshabilitado, cargando, error** (cuando aplique).

- **Foco visible siempre:** anillo de 2px en `--accent` con 2px de offset. Nunca se elimina el outline sin reemplazarlo.
- **Presionado:** en táctil no hay hover, así que el feedback de presión es obligatorio (escala 0.98 + oscurecido del relleno). Es la única confirmación de que el toque entró.
- **Cargando:** el control conserva su ancho (no colapsa ni salta), reemplaza el label por un spinner y queda inerte. Prohibido el doble submit por control sin estado de carga.
- **Deshabilitado:** opacidad 0.45 + cursor `not-allowed`. Si un control está deshabilitado, **algo en pantalla explica por qué** — un botón muerto sin explicación es un callejón.

### 6.3 Jerarquía de botones

| Variante | Relleno | Uso |
|---|---|---|
| **Primario** | `--accent` / `--accent-fg` | Una sola acción principal por pantalla |
| **Secundario** | `--surface` + `--border-strong`, texto `--text` | Acciones alternativas |
| **Sutil** | Transparente, texto `--text-muted` | Terciario, cancelar |
| **Destructivo** | Texto/borde `--danger`; relleno `--danger` solo en el botón de confirmación del diálogo de borrado | Borrar, descartar |

**Toda acción destructiva pide confirmación explícita en un diálogo**, con el nombre de lo que se borra en el texto y el verbo real en el botón ("Borrar rutina", nunca "Aceptar").

### 6.4 Estados de pantalla

Toda pantalla que carga datos define sus **cuatro estados**: cargando (skeletons con la forma del contenido real, nunca spinner centrado a pantalla completa), vacío, error, contenido.

**Estado vacío:** ícono de trazo, un título en `h2`, una línea de `body-sm` que explique qué va a pasar, y **la acción que lo resuelve** como botón primario. Sin ilustraciones grandes, sin humor. Nunca un vacío mudo.

---

## 7. Navegación

### 7.1 Disposición compacta (`< --bp-wide`)

**Tabs inferiores persistentes.** Barra fija al borde inferior, con `padding-bottom: env(safe-area-inset-bottom)`.

- Alto de la barra: **56px** + safe area.
- Cada tab: ícono de 24px + label de 11px, área tocable de alto completo, ancho repartido en partes iguales.
- Tab activo: ícono relleno + label y ícono en `--accent`. Inactivo: ícono de trazo + `--text-muted`.
- La barra usa `--surface` con un borde superior de 1px en `--border`. Nada de transparencias con blur: en movimiento, el texto detrás la ensucia.

### 7.2 Disposición amplia (`≥ --bp-wide`)

**La navegación cambia de forma: pasa a una barra horizontal superior fija.** Mismos ítems, mismo orden, mismos labels; cambia la posición y la orientación, no el modelo mental.

Por qué cambia:
- El argumento del pulgar desaparece con mouse/trackpad: en desktop el recorrido natural del puntero arranca arriba, no abajo.
- Una barra de tabs pegada al fondo de una ventana de 1440px deja los ítems lejísimos entre sí y del contenido: se lee como cromo de sistema operativo, no como navegación de la app.
- En desktop el recurso escaso es la **altura**, no el ancho; una barra superior de 56px se comparte con el título de pantalla y se amortiza.

**No hay sidebar en ningún ancho.** Es una decisión cerrada.

- Alto de la barra superior: **56px**, `--surface` + borde inferior `--border`.
- Contenido de la barra: marca a la izquierda, tabs al centro-izquierda, toggle de modo de color a la derecha.
- Tab activo: label en `--accent` + indicador inferior de 2px en `--accent`.
- El contenido de la página se centra con `max-width: 960px` y padding lateral de 24px. Fit no tiene datos que justifiquen ocupar 1440px de ancho: una lista de rutinas a todo lo ancho es peor de leer.
- **Modo entrenar es la excepción al `max-width`:** ocupa todo el ancho disponible y escala el timer a `timer-hero` amplio (140px). Es la pantalla que más gana con la pantalla grande (se mira de lejos, apoyada en un banco).

### 7.3 Navegación durante Modo entrenar

La navegación **permanece visible** en Modo entrenar, coherente con la decisión de tabs persistentes. No hay modo inmersivo ni ocultamiento de la barra.

**Salir con el timer corriendo pide confirmación (decidido).** Un toque accidental en un tab durante un timer en vivo es el peor error posible de esta app: se pierde el progreso de la sesión. Por eso, cualquier intento de abandonar Modo entrenar con el timer corriendo —tocar un tab, el botón de volver del header o el gesto/botón atrás del navegador— abre un diálogo de confirmación antes de irse. (Regla funcional: RN-010 en `docs/requirements.md`.)

Forma del diálogo:

- **Nombra la consecuencia real, no la acción genérica.** Título: "¿Salir del entrenamiento?". Cuerpo: una línea que diga que se pierde el progreso de la sesión.
- **Botón de confirmación destructivo** (`--danger`), con el verbo real: "Salir y perder el progreso". Botón de cancelar en variante sutil, y es **el que tiene el foco inicial**: el default seguro es quedarse.
- **El timer no se detiene mientras el diálogo está abierto**, y el número sigue visible detrás del backdrop. Pausar por sistema sería tomar una decisión por el usuario; ocultar el número lo dejaría a ciegas justo cuando está decidiendo.
- El diálogo cumple los mismos mínimos que cualquier otro (Esc y backdrop cierran = cancelar, targets ≥44px, ambos modos de color).

---

## 8. Contención responsive

Sección de referencia obligatoria: todo spec visual declara su comportamiento contra esta sección, y el QA visual (`docs/qa-visual.md`) la verifica.

### 8.1 Token de umbral

| Token | Valor | Nombre en Tailwind |
|---|---|---|
| `--bp-wide` | **1024px** | screen `wide` (Tailwind v4: `--breakpoint-wide: 1024px`) |

Se usa como prefijo `wide:` en las utilidades. **Fit tiene un solo umbral de disposición.** No se introducen breakpoints intermedios (`sm:`, `md:`) para cambiar la *disposición*; los escalones intermedios de Tailwind pueden usarse para ajustes finos de tipografía o espaciado, nunca para reacomodar el layout ni mover la navegación.

**Por qué 1024px:** es la línea clásica donde el dispositivo deja de ser "algo que se sostiene con la mano" y pasa a ser "algo apoyado con puntero". Una tablet en vertical (768–834px) se sigue sosteniendo y se sigue tocando con el pulgar, así que le conviene la disposición compacta con tabs abajo. Además coincide con el `lg` de Tailwind, así que el número no es arbitrario dentro del sistema de estilos del proyecto.

### 8.2 Rangos

| Disposición | Rango exacto |
|---|---|
| **Compacta** | **375px – 1023px** (ambos inclusive) — es decir, `< --bp-wide` |
| **Amplia** | **≥ 1024px** |

**Ancho mínimo soportado: 375px.** Por debajo de 375px la app no promete contención. **No hay pantalla de gate ni bloqueo**: la app sigue funcionando y se degrada como pueda, pero los cuatro invariantes no se garantizan ni se QA-ean por debajo de ese ancho. Poner un cartel de "tu pantalla es muy chica" en una app que se usa en el celular sería peor que el problema.

### 8.3 Cuánto ancho le resta la navegación al contenido

**Cero. La navegación persistente no le resta ancho al contenido en ninguna disposición.**

- En compacto es una **barra inferior horizontal**: consume **56px + safe-area-inset-bottom de alto**, y **0px de ancho**.
- En amplio es una **barra superior horizontal**: consume **56px de alto**, y **0px de ancho**.
- No hay sidebar, no hay rail lateral, no hay panel colapsable. Nada lateral y persistente existe en Fit.

**Consecuencia práctica para el QA:** el ancho de `<main>` es igual al ancho del viewport (menos la barra de scroll del navegador, si la hay). El régimen compacto/amplio puede juzgarse directamente contra el viewport, y **no** existe el caso "probar con la navegación abierta y cerrada": la navegación no tiene estado abierto/cerrado.

Lo que la navegación **sí** consume es altura, y eso tiene una consecuencia obligatoria: **toda pantalla scrolleable reserva 96px de espacio libre al final** para que el último elemento y cualquier botón flotante queden por encima de la barra inferior y de la safe area.

### 8.4 Los cuatro invariantes

Se cumplen **siempre**, en todo ancho ≥375px, en los dos modos de color:

1. **Sin scroll horizontal del `body`.** Ningún ancho fijo mayor al viewport, ningún texto largo sin `overflow-wrap`, ninguna fila de chips que empuje el layout. En 375px, nada se sale.
2. **Modales completos y scrolleables.** Se ven enteros, nunca cortados; el contenido largo scrollea **dentro** del modal con el header y las acciones siempre alcanzables; nunca son atrapantes (siempre hay una salida visible: X, Esc y backdrop). Alto máximo: `min(90dvh, 100dvh - 32px)`. En compacto, los modales de acción rápida (elegir ejercicio/bloque del pool) se presentan como **hoja inferior** que llega hasta el 90% del alto y scrollea internamente; en amplio, como diálogo centrado de `max-width: 560px`.
3. **Ninguna acción inalcanzable.** Ningún menú, popover o select se sale de la pantalla ni queda tapado por la barra de navegación. Los popovers cerca del borde se reposicionan hacia adentro; los que no entran se convierten en hoja inferior.
4. **Las superficies anchas scrollean dentro de sí mismas.** Listas de series, filas de bloques, cualquier grilla o fila larga scrollea horizontalmente **en su propio contenedor**, con corte visible en el borde para que se note que hay más, sin romper el layout de la página ni generar scroll del `body`.

### 8.5 Qué cambia entre disposiciones (y qué no)

| | Compacta (375–1023px) | Amplia (≥1024px) |
|---|---|---|
| Navegación | Tabs inferiores fijas | Barra superior fija |
| Ancho de contenido | 100% – 16px de padding lateral | `max-width: 960px`, centrado, 24px de padding |
| Listas (rutinas) | 1 columna | 2 columnas |
| Historial | 1 columna | **1 columna** — excepción: la agrupación por semana y día tiene un solo eje, el tiempo (§13.10) |
| Acción rápida (pool) | Hoja inferior | Diálogo centrado 560px |
| Timer principal | `timer-hero` 88px | `timer-hero` 140px, a todo el ancho |
| Acción primaria de pantalla | Botón ancho al pie / flotante | Botón alineado al header |
| Toggle de modo de color | Header de Mis rutinas, arriba a la derecha | Barra superior, arriba a la derecha |
| Targets táctiles | ≥44px (≥64px en entrenar) | Se mantienen ≥44px |

**Lo que no cambia nunca:** el orden de la información, los labels, la cantidad de pasos de un flujo y la semántica del color. La disposición amplia es la misma app más cómoda, no otra app.

---

## 9. Movimiento

- Micro-interacciones (presión, hover, foco): **120ms**, `ease-out`.
- Transiciones de estado y aparición de superficies: **200ms**, `cubic-bezier(.2,0,0,1)`.
- Hojas inferiores y modales: **240ms** de entrada, **160ms** de salida.
- **El timer no anima.** Los dígitos cambian sin transición. Las únicas animaciones permitidas en Modo entrenar son el progreso continuo (anillo/barra) y el cambio de fase, que puede hacer un cross-fade de 200ms del color de superficie.
- **`prefers-reduced-motion: reduce` se respeta siempre:** todo se reduce a cambios de opacidad de 100ms; nada se desplaza ni escala.

---

## 10. Iconografía

- Íconos de **trazo (outline)**, tamaño nominal **24px**, grosor de trazo ~2px, extremos redondeados.
- El tab activo es la única excepción: usa la variante **rellena** para reforzar el estado sin depender solo del color.
- Los íconos nunca van solos si comunican una acción no obvia: llevan label o, como mínimo, `aria-label` y tooltip en amplio.
- La librería concreta es una decisión técnica de `frontend`; lo que este documento fija es el estilo (trazo, peso, tamaño).

---

## 11. Equipo de un ejercicio: requisito fijo vs. alternativas

Spec de la Fase 2 (RF-016 a RF-018, RN-013 a RN-015). Lo funcional está cerrado en `docs/requirements.md` y `docs/screens.md` §4 y no se redefine acá: un ejercicio declara **cero o más grupos**, dentro del grupo la relación es **O** (cualquiera sirve) y entre grupos es **Y** (hacen falta todos). Lo que esta sección fija es **cómo se ve esa estructura de dos niveles**, para que "mancuernas **y** banco" no se pueda confundir con "mancuernas **o** kettlebell".

### 11.1 La regla: un grupo = una caja

**Un grupo se dibuja siempre como una sola caja, incluso si tiene un solo elemento.** La caja *es* el grupo: lo que está adentro son alternativas, lo que está afuera es otro requisito.

El riesgo que esta regla ataja: una fila de chips sueltos (`kettlebell` `mancuernas` `banco`) se lee por convención como una lista de etiquetas equivalentes —es decir, se lee como **O**—, que es exactamente la lectura equivocada la mitad de las veces. Por eso la estructura no se delega a la separación entre chips.

La distinción se apoya en **tres señales redundantes**, nunca en el color:

| Señal | Dentro del grupo (O) | Entre grupos (Y) |
|---|---|---|
| **Contención** | Mismo contenedor | Contenedores distintos |
| **Conector** | `o` minúscula | `Y` mayúscula |
| **Posición del conector** | Adentro de la caja | Afuera, sobre el fondo |

`o` y `Y` son palabras reales y visibles, no íconos ni glifos: se leen igual en pantalla, en lector de pantalla y en escala de grises. Y son la misma palabra que usa la doc funcional para describir el modelo, así que no hay código propio que aprender.

**Prohibido acá:** teñir chips de equipo con el acento o con un semántico; usar `+`, `&`, `/` o un ícono como conector; separar grupos solo con espacio, coma o punto medio.

### 11.2 Chip de grupo (variante de solo lectura)

Es la pieza que aparece en cualquier superficie que **muestre** el equipo de un ejercicio sin editarlo: el listado del pool, y más adelante el detalle del historial (RN-015).

| Propiedad | Valor |
|---|---|
| Caja | `inline-flex`, `align-items: center`, alto mínimo **24px**, padding **2px 8px** |
| Radio | `--r-sm` (8px) |
| Fondo | `--surface-2` (los dos modos) |
| Borde | 1px `--border` (los dos modos) |
| Texto | Inter **13 / 18, peso 500**, color `--text`, sin tracking extra |
| Contenido | Los nombres de los elementos del grupo, en el orden en que los devuelve la API, unidos por el conector `o` |
| Conector interno `o` | Mismo tamaño y peso, color **`--text-muted`**, 4px de aire a cada lado |
| Interactividad | **Ninguna.** No es botón ni link, no tiene hover ni foco: el renglón entero del ejercicio ya es el destino de edición. Un chip clickeable prometería un filtro que no existe ahí |

En claro el chip queda apenas hundido respecto del `--surface` de la tarjeta; en oscuro queda apenas elevado. Es intencional y coherente con §2: en cada modo la separación se consigue por el lado que funciona, con contraste equivalente.

### 11.3 Conector `Y` entre grupos

| Propiedad | Valor |
|---|---|
| Texto | `Y` en mayúscula |
| Tipografía | Inter **12 / 16, peso 700**, mayúsculas, `letter-spacing: +0.08em` |
| Color | `--text-muted` |
| Ubicación | **Fuera** de todo chip, sobre el fondo del renglón; 6px de aire a cada lado |

Vive fuera de la caja a propósito: la posición ya dice de qué nivel habla, antes de leer la letra.

### 11.4 La línea de equipo en el listado del pool

Cada renglón de ejercicio del Pool (`docs/screens.md` §4) pasa a tener dos líneas:

- **Línea 1 — nombre del ejercicio:** Inter 16 / 24, peso 600, `--text`.
- **Línea 2 — equipo:** 4px debajo del nombre, alineada a su izquierda. Es un contenedor que envuelve (`flex-wrap`) con **6px de gap** horizontal y vertical, y contiene los chips de grupo intercalados con el conector `Y`.

El renglón conserva su forma actual: tarjeta `--surface`, borde 1px `--border`, radio `--r-lg`, padding 12px 16px, y el botón de borrar de 44×44 a la derecha, centrado verticalmente respecto del renglón completo.

Cómo se lee, con los datos de la semilla (`requirements.md` §6.1):

```
goblet squats con kettlebell
[ kettlebell ]

remos
[ kettlebell o mancuernas ]

(hipotético, dos grupos)
press de banca
[ mancuernas ]  Y  [ banco ]

burpees
Sin equipo
```

**Sin prefijo ni ícono.** El renglón de ejercicio muestra una sola clase de metadato —el equipo—, así que un rótulo "Equipo:" sería ruido permanente para desambiguar algo que no está ambiguo (§1, silencio visual). El contexto lo aporta la etiqueta oculta de §11.10 para lectores de pantalla.

**Esqueleto de carga:** la fila de esqueleto del listado de ejercicios pasa a tener dos barras: una de 16px de alto al 60% del ancho (nombre) y otra de 14px al 45% (equipo), separadas 4px. El esqueleto tiene la forma del contenido real (§6.4).

**Los tres listados del Pool** siguen siendo secciones apiladas en una sola pantalla, en el orden **Ejercicios → Bloques → Elementos**, separadas 32px. No se introducen tabs internos: la app ya tiene una barra de tabs de navegación y una segunda fila de tabs adentro de una pantalla obliga a distinguir dos metáforas idénticas con significados distintos. El renglón de **Elemento** usa el mismo patrón que el de Ejercicio pero de una sola línea (nombre + borrar 44×44), sin línea de equipo.

### 11.5 "Sin equipo" nunca es un chip

Un ejercicio sin grupos muestra, en la línea 2, el texto **"Sin equipo"** en Inter 14 / 20, peso 400, `--text-muted`. Sin caja, sin borde, sin fondo.

Es una regla dura: **un chip significa "necesitás esto"**. Dibujar la ausencia de equipo con la misma forma que un requisito rompe la única convención que esta sección construye, y en un listado escaneado de reojo se leería como "necesita algo llamado sin equipo".

### 11.6 Editor de grupos (edición de ejercicio)

La pantalla de edición de ejercicio (`ExerciseForm`) suma, **32px debajo del campo Nombre**, una sección "Equipo".

**Encabezado de la sección**
- Título "Equipo": Inter 17 / 24, peso 600, `--text`.
- Ayuda, una línea, siempre visible, 4px debajo: Inter 14 / 20, `--text-muted` — *"Cada equipo que agregues es algo que el ejercicio necesita. Si se puede reemplazar, agregale alternativas: con cualquiera alcanza."*

La ayuda es permanente y no se esconde en un tooltip: el modelo de dos niveles es la única cosa no obvia de esta pantalla, y se toca cada varios meses (nadie lo memoriza).

**Tarjeta de grupo**

| Propiedad | Valor |
|---|---|
| Fondo | `--surface` |
| Borde | 1px `--border` |
| Radio | `--r-md` (12px) |
| Padding | 8px |

**Fila de elemento** (dentro de la tarjeta)

| Propiedad | Valor |
|---|---|
| Alto | mínimo **44px** |
| Fondo | `--surface-2` · Radio `--r-sm` |
| Texto | Inter 16 / 24, peso 400, `--text`, sangría izquierda 12px, `overflow-wrap: anywhere` |
| Quitar | Botón de ícono **44×44** al extremo derecho, `XMarkIcon` de trazo 24px |

**Conector `o` entre filas del mismo grupo:** fila propia de 20px de alto, texto `o` en Inter 13 / 18, peso 500, `--text-muted`, alineado a la izquierda con la misma sangría de 12px que el texto de las filas. Sin línea, sin caja: la unidad visual de la tarjeta ya está haciendo el trabajo.

**Conector `Y` entre tarjetas:** fila propia de 20px de alto con 8px de aire arriba y abajo. A 12px del borde izquierdo, el texto `Y` con el estilo de §11.3; 8px después, una línea de 1px `--border` que llega hasta el borde derecho. La línea es la que hace evidente que ahí hay un corte estructural, y la palabra es la que dice cuál.

**Botón "Agregar alternativa"** (dentro de la tarjeta, 4px debajo de la última fila)
- Variante **sutil** de §6.3: fondo transparente, texto `--text-muted`, Inter 13 / 18 peso 600, ícono `+` de trazo 20px, alineado a la izquierda con sangría 12px, alto 44px, ancho completo de la tarjeta.
- Hover / foco: fondo `--accent-tint` y texto + ícono en `--accent`.

**Botón "Agregar equipo"** (fuera de las tarjetas, 12px debajo de la última)
- Variante **secundaria** de §6.3: `--surface` + borde 1px `--border-strong`, texto `--text`, Inter 14 / 20 peso 600, ícono `+` de trazo 20px en `--text-muted`, contenido centrado, ancho completo, alto 48px, radio `--r-md`.
- Etiqueta: **"Agregar equipo"** cuando no hay ningún grupo; **"Agregar otro equipo"** cuando ya hay al menos uno.

Los dos botones de agregar se diferencian por forma y por palabra, no por color: uno es una caja de ancho completo centrada y afuera ("otro **equipo**" = Y), el otro es texto alineado a la izquierda adentro de una tarjeta ("**alternativa**" = O). Las palabras enseñan el modelo solas. **No se inventa una variante "dashed"** ni ninguna otra fuera de las cuatro de §6.3.

**Un solo control de quita, un solo camino.** No hay botón "quitar grupo" separado: se quitan elementos, y **cuando se quita el último elemento el grupo desaparece con él**. Dos controles de borrado para el mismo resultado (la X de la única fila y una X de la tarjeta) obligarían al usuario a preguntarse cuál es cuál cada vez. Quitar un requisito de dos alternativas cuesta dos toques, y es el caso raro (1 de 15 ejercicios de la semilla).

### 11.7 Estados

**El grupo vacío no existe como estado persistente.** "Agregar equipo" **abre directamente el selector rápido** sobre elementos (`docs/screens.md` §6); el grupo nace con su primer elemento adentro. Consecuencias:

- RN-014 se cumple **por construcción**: el formulario nunca queda inválido por el equipo, y **el botón de guardar nunca se bloquea** por esta sección. La única validación de la pantalla sigue siendo el nombre.
- **Placeholder de destino:** mientras el selector está abierto por "Agregar equipo", en el lugar donde va a caer la tarjeta se muestra una caja de 60px de alto, borde 1px `--border-strong`, radio `--r-md`, fondo transparente, con el texto centrado "Elegí el primer elemento" (Inter 13 / 18, peso 500, `--text-muted`). Si el selector se cierra sin elegir, el placeholder desaparece y **no se crea ningún grupo**.
- Al quitar el último elemento, la tarjeta desaparece con una transición de opacidad de 120ms; con `prefers-reduced-motion: reduce`, sin transición ni desplazamiento (§9).

**Los siete estados de los controles de esta sección (§6.2):**

| Control | Reposo | Hover | Foco | Presionado | Deshabilitado | Cargando | Error |
|---|---|---|---|---|---|---|---|
| **X de quitar elemento** | Ícono `--text-muted` | Fondo `--danger-tint`, ícono `--danger` | Anillo 2px `--accent`, offset 2px (visible también sobre hover) | Escala 0.98 | No aplica: nunca se deshabilita | No aplica: es edición local, no llama al backend | No aplica |
| **Agregar alternativa** | Sutil, `--text-muted` | Fondo `--accent-tint`, texto `--accent` | Anillo 2px `--accent`, offset 2px | Escala 0.98 | Nunca | No aplica: abre un modal, y el modal tiene su propio esqueleto | No aplica |
| **Agregar equipo** | Secundario | Borde `--text-muted`… fondo `--surface-2` | Anillo 2px `--accent`, offset 2px | Escala 0.98 | Nunca — aun con el pool de elementos vacío, porque el selector muestra su propio estado vacío con el CTA que lo resuelve, y un botón muerto sería un callejón (§6.2) | No aplica | No aplica |

**La X de quitar no pide confirmación.** La regla de confirmación destructiva (§6.3) gobierna lo que se persiste; acá es una edición de formulario todavía no guardada y trivialmente reversible (se vuelve a agregar). Pedir un diálogo por cada elemento convertiría una edición de tres toques en una de nueve. El carmesí aparece **en la interacción** (hover/foco/press), no en reposo: en reposo, una columna de X rojas en cada fila pintaría la pantalla de alarma sin que haya ninguna.

**Selector rápido invocado desde acá:** título "Agregar equipo" cuando crea un grupo, "Agregar alternativa" cuando suma al grupo existente. Su forma (hoja inferior en compacto, diálogo de 560px en amplio) y sus estados ya están fijados y no cambian.

**Estado "sin ningún grupo" en el editor:** en lugar de tarjetas, una sola línea en Inter 14 / 20, `--text-muted` — *"Sin equipo. Se hace con el peso del cuerpo."* — y debajo el botón "Agregar equipo". **No se usa el estado vacío de pantalla de §6.4** (ícono de trazo + `h2` + CTA): eso está reservado para una pantalla que no tiene nada que mostrar. Acá el vacío es un valor **válido, correcto y frecuente** (9 de los 15 ejercicios de la semilla), no un problema a resolver; dibujarlo como un vacío alarmaría sobre un ejercicio que está perfecto.

### 11.8 Filtro de ejercicios por elemento — **agregado no solicitado, confirmar**

RF-018 es de esta misma fase y su control comparte pantalla con la línea de equipo, así que **hay que resolver el choque visual sí o sí**: si el filtro se dibujara como una fila de chips, esos chips serían indistinguibles de los chips de grupo que están dos líneas más abajo. Lo que sigue evita ese choque; el orquestador confirma antes de que `frontend` lo tome.

- **El filtro no se dibuja con chips.** Es un **botón de filtro** al tope de la sección Ejercicios, alineado a la izquierda, alto 44px, variante secundaria, con el texto "Todos los equipos" cuando no hay filtro y un ícono de chevron a la derecha.
- **Con filtro activo el botón se convierte en una píldora de acento:** fondo `--accent-tint`, texto `--accent` (Inter 14 / 20, peso 600), con el nombre del elemento ("Kettlebell" / "Sin equipo") y una **X de 44×44 para limpiarlo**. El acento acá está permitido y es exacto: es **estado activo de un control**, no dato teñido (§3.1). Queda establecido el contraste de lectura de toda la pantalla: **chip neutro = dato; acento = control activo.**
- Las opciones se presentan con la misma forma que el selector rápido (hoja inferior en compacto, diálogo centrado en amplio), con "Todos los equipos" y "Sin equipo" arriba de la lista de elementos.
- **Filtro sin resultados:** mensaje de `docs/screens.md` §4 más un botón sutil "Limpiar filtro"; el botón de filtro activo permanece visible arriba para que nunca haya una lista vacía sin causa a la vista.

> **Señal para el analista (vía orquestador):** `docs/screens.md` §4 no dice **con qué forma** se presenta el selector de opciones del filtro, y §6 documenta el selector rápido como invocable desde tres lugares que no incluyen el filtro. Si el filtro reusa ese componente, §6 necesita una línea; si no, es un control propio. Segunda señal: **no está definido si un mismo elemento puede repetirse en dos grupos del mismo ejercicio** (RN-014 no lo dice). Hasta que se defina, el selector lista todos los elementos sin deshabilitar ninguno; si la regla resultara ser "no se repite", los ya usados se muestran deshabilitados con la razón visible al lado, nunca ocultos.

### 11.9 Contención responsive

**La sección de equipo no cambia de disposición.** Mismas cajas, mismo orden, mismos conectores en compacto y en amplio; lo único que cambia es el ancho del contenedor que la hospeda (100% − 16px en compacto, `max-width: 960px` en amplio). No se introduce ningún breakpoint fuera de `--bp-wide` (§8.1).

| Invariante (§8.4) | Cómo se cumple acá |
|---|---|
| **1 · Sin scroll horizontal del `body`** | La línea de equipo **envuelve** (`flex-wrap`) con gap de 6px. Los nombres largos parten dentro del chip con `overflow-wrap: anywhere`. El conector `Y` viaja **pegado al chip que le sigue** (los dos en un `inline-flex` con 6px de gap) para que nunca quede huérfano al final de una línea |
| **2 · Modales completos y scrolleables** | El selector rápido ya cumple y no se modifica (90dvh, hoja en compacto, 560px en amplio) |
| **3 · Ninguna acción inalcanzable** | Los botones de agregar viven en el flujo del formulario, no en popovers; la pantalla mantiene los 96px libres al final (§8.3) |
| **4 · Las superficies anchas scrollean en sí mismas** | **No aplica por decisión explícita:** la línea de equipo **nunca** scrollea en horizontal. Un requisito escondido fuera del borde es una pérdida funcional —el usuario cree que sabe qué necesita y le falta el banco—, y en un listado que se escanea de arriba a abajo el usuario no descubre que había más a la derecha. Se prefiere una segunda línea de alto |

A 375px, el chip más largo de la semilla (`kettlebell o mancuernas`) mide unos 160px: entran dos grupos por línea, y tres grupos ocupan dos líneas sin cortar nada.

### 11.10 Accesibilidad

- **Los conectores son texto real**, así que el lector de pantalla lee "kettlebell o mancuernas Y banco" sin ayuda extra. No se usan `aria-label` que dupliquen o contradigan lo visible.
- La línea de equipo del listado arranca con una etiqueta **visualmente oculta** "Equipo: ", para dar contexto a quien no ve la maquetación.
- **Ningún estado depende del color** (§15): la estructura Y/O es forma + palabra; el filtro activo es acento **más** el nombre del elemento **más** la X.
- Contrastes verificados en los dos modos: texto de chip `--text` sobre `--surface-2` (claro 15.8:1, oscuro 13.9:1); conectores `--text-muted` sobre `--bg`/`--surface` (≥ 5.5:1 en los dos modos); ícono X en `--danger` sobre `--danger-tint` (≥ 4.5:1).
- Targets: X de quitar **44×44**; filas de elemento **≥44px** de alto; botones de agregar 44px y 48px; separación mínima de 8px entre targets adyacentes.

### 11.11 Checklist de aceptación visual

1. **Listado — grupo fijo:** "goblet squats con kettlebell" muestra **un** chip con la palabra `kettlebell` y nada más.
2. **Listado — grupo alternativo:** "remos" muestra **un solo** chip que dice `kettlebell o mancuernas`, con el `o` en gris más claro que los nombres.
3. **Listado — dos grupos:** un ejercicio con dos grupos muestra **dos** chips separados por una `Y` mayúscula que está **fuera** de las cajas, sobre el fondo del renglón.
4. **Listado — sin equipo:** "burpees" muestra el texto `Sin equipo` en gris, **sin caja, sin borde y sin fondo**.
5. **Neutralidad:** ningún chip de equipo usa violeta, verde, carmesí ni ámbar, en modo claro y en modo oscuro; el texto del chip se lee cómodo en los dos.
6. **375px:** ninguna línea de equipo genera scroll horizontal ni queda cortada; el conector `Y` nunca aparece solo al final de una línea.
7. **Editor — dos niveles:** dos grupos se ven como dos tarjetas separadas por la fila `Y` + línea fina; dos alternativas del mismo grupo se ven como dos filas dentro de **la misma** tarjeta separadas por la `o` minúscula.
8. **Editor — crear grupo:** "Agregar equipo" abre el selector; cerrarlo sin elegir **no deja ninguna tarjeta ni ningún grupo vacío** en pantalla.
9. **Editor — quitar:** quitar el último elemento de un grupo hace desaparecer la tarjeta completa; no hay ningún otro botón de "quitar grupo".
10. **Editor — X:** cada X mide 44×44, en reposo es gris, en hover/foco se pone carmesí con fondo tenue, y el anillo de foco es visible con teclado.
11. **Editor — sin equipo:** un ejercicio sin grupos muestra la línea "Sin equipo. Se hace con el peso del cuerpo." y el botón "Agregar equipo", **sin** ícono grande ni estado vacío de pantalla.
12. **Guardar:** el botón de guardar nunca queda deshabilitado por la sección de equipo.
13. **Movimiento:** con `prefers-reduced-motion: reduce`, quitar un elemento no anima desplazamientos.
14. **(Si se confirma §11.8) Filtro:** el control de filtro no se dibuja con chips neutros; con filtro activo es una píldora en tinte de acento con el nombre del elemento y una X de 44×44 para limpiarlo, y nunca se confunde con un chip de equipo.

---

## 12. Estado sin conexión en Modo entrenar

Spec de la Fase 3 (RN-004, RNF-004). Lo funcional está cerrado en `docs/requirements.md` y `docs/screens.md` §5 y no se redefine acá: **la pantalla y el timer funcionan con la red caída, y el registro de historial se sincroniza al recuperar la conexión**. Lo que esta sección fija es **cómo se ve esa condición** dentro de una pantalla que ya está pintada a sangre completa con un color que cambia solo.

### 12.1 Qué es y qué no es

**Es una condición, no un evento.** Dura lo que dure la caída de red —pueden ser dos minutos o todo el entrenamiento— y no la provocó el usuario. Esa naturaleza descarta dos formas:

- **No es un toast.** El toast es un aviso efímero de algo que *acaba de pasar*, con descarte y con vida corta. Un toast que se queda quince minutos rompe la promesa del patrón, y encima el visor de toasts se ancla al borde inferior en compacto: en Modo entrenar eso es exactamente donde vive el par pausar/avanzar de ≥72px (§6.1). Un aviso plantado sobre los dos controles que se tocan sin mirar, con la mano transpirada, es un riesgo de toque errado durante el timer.
- **No es un banner de ancho completo.** Un banner grita "algo se rompió" y le roba altura al dato dominante. Acá **no se rompió nada**: el timer sigue contando igual y el usuario no tiene ninguna acción que tomar. Un cartel a todo lo ancho sobredimensiona una noticia que es, en el fondo, tranquilizadora.

**Es una píldora de estado en una franja reservada**, arriba, chica, muda, sin acción y sin descarte.

**Por qué no lleva X de descartar:** descartar una condición no la apaga, así que el control mentiría. Además pondría un target de 44×44 pegado al botón de volver, en la esquina superior, que es justo donde §1 dice que no va nada crítico y donde un toque errado abre el diálogo de salida.

### 12.2 La franja de estado de la sesión

Se introduce un **slot fijo**, no un elemento suelto: la **franja de estado de la sesión**. Es el único lugar de Modo entrenar donde se muestra una condición del sistema (hoy, la conectividad).

| Propiedad | Valor |
|---|---|
| Ubicación | Fila propia de ancho completo, **8px debajo** de la fila del header (volver + "Bloque X de Y") y **arriba** del área del timer |
| Alto | **40px** en compacto · **48px** en amplio. **Reservado siempre**, esté ocupada o vacía |
| Contenido | Un solo elemento, centrado horizontal y verticalmente |
| Fondo | Ninguno. Es transparente sobre el color de fase |
| Interactividad | **Ninguna, nunca.** La franja no hospeda botones, links ni acciones |

**Por qué el alto se reserva aunque esté vacía.** El área del timer es un `flex-1` centrado: si la franja apareciera y desapareciera, el número de 88px se correría verticalmente en el instante en que se cae la red —es decir, se movería justo mientras el usuario lo está mirando—. §4.2 prohíbe que el timer reflowee; el espíritu de esa regla es que **el número no se mueve nunca**, no solo al cambiar de dígito. Reservar 40px cuesta el 6% del alto de un 375×667 y compra cero salto. La alternativa evaluada —flotar la píldora en posición absoluta— evita el salto pero a 375px se le monta encima al nombre del bloque del header, así que se descarta.

**Por qué centrada y no pegada a un borde.** En amplio, Modo entrenar es la única pantalla que ocupa todo el ancho (§7.2): una píldora anclada a la izquierda de un viewport de 1440px queda a 600px del eje donde el usuario tiene la vista. Centrada, cae en la misma columna óptica que el número, sin tocarlo.

### 12.3 La píldora: cómo sobrevive a los tres fondos de fase

El problema real: la píldora convive con seis superficies distintas (trabajo / descanso / preparación × claro / oscuro), y en modo claro el texto de fase **se invierte** (blanco sobre trabajo y descanso, casi negro sobre preparación). Ningún color fijo funciona en las seis.

**La solución es no elegir ningún color: la píldora hereda el color de la fase.**

- **Texto e ícono en `currentColor`**, que en Modo entrenar es siempre `--phase-*-fg`. El contraste queda garantizado por construcción, porque es el mismo par que ya usa el número del timer.
- **Relleno con `--phase-veil`**, un velo neutro con alfa que **empuja el fondo en la dirección contraria al texto** en los seis casos, así que nunca baja el contraste: lo sube.
- **Borde de 1px en `currentColor` al 35%**, para que la píldora quede delimitada aunque el velo sea sutil sobre una fase oscura.

**Token nuevo** (familia `--phase-*`, así que **solo vive en Modo entrenar**, §3.1):

```
/* claro  */  --phase-veil   rgba(0, 0, 0, .14)
/* oscuro */  --phase-veil   rgba(255, 255, 255, .10)
```

No introduce un hue (§3.1): es negro o blanco con alfa. Va en la dirección que cada modo ya usa para separar superficies (§2): en claro se hunde, en oscuro sube luminosidad.

**Contraste verificado del texto sobre la píldora, en las seis combinaciones:**

| Fase · modo | Superficie con velo | Texto | Contraste |
|---|---|---|---|
| Trabajo · claro | `#C4441F` + negro 14% ≈ `#A93B1B` | `#FFFFFF` | **6.3:1** |
| Descanso · claro | `#0B6E93` + negro 14% ≈ `#095F7E` | `#FFFFFF` | **7.1:1** |
| Preparación/pausa · claro | `#F1F3F7` + negro 14% ≈ `#CFD1D4` | `#12151C` | **12.1:1** |
| Trabajo · oscuro | `#3A1408` + blanco 10% ≈ `#4E2B21` | `#FF8452` | **5.1:1** |
| Descanso · oscuro | `#08222F` + blanco 10% ≈ `#213844` | `#58C8EE` | **6.4:1** |
| Preparación/pausa · oscuro | `#1D2430` + blanco 10% ≈ `#343A45` | `#EDF0F5` | **9.6:1** |

El piso es 5.1:1, por encima del 4.5:1 que pide texto normal (§3.6). Y **el velo mejora el contraste en las seis**, nunca lo degrada: ese es el criterio por el que se eligió el signo del alfa en cada modo.

**Geometría de la píldora:**

| Propiedad | Valor |
|---|---|
| Caja | `inline-flex`, `align-items: center`, gap **8px**, padding **0 12px** |
| Alto | **32px** en compacto · **36px** en amplio |
| Radio | `--r-full` (§5.3 la reserva para chips de estado) |
| Relleno | `--phase-veil` |
| Borde | 1px, `currentColor` al **35%** |
| Texto | Inter **13 / 18, peso 600** en compacto · **14 / 20, peso 600** en amplio · color `currentColor` · `white-space: nowrap` |
| Ícono | Trazo **20px**, `currentColor`, `flex-shrink: 0`, a la izquierda del texto |
| Ancho máximo | `calc(100% - 32px)` |
| Sombra | Ninguna, en ningún modo. Sobre una superficie de fase la sombra no se lee y ensucia el borde |

### 12.4 Las tres variantes

Misma píldora, tres contenidos. **Las tres se distinguen por ícono y palabra, nunca por color.**

| Variante | Ícono (trazo, 20px) | Texto | Cuándo |
|---|---|---|---|
| **Sin conexión** | Antena / señal tachada | **"Sin conexión · se guarda al reconectar"** | Mientras la app no tiene red |
| **Sincronizando** | Flecha circular, girando | **"Sincronizando"** | Al volver la red, **solo si hay algo pendiente en cola** |
| **Guardado** | Check dentro de un círculo | **"Guardado"** | Cierre de una sincronización que efectivamente subió algo |

**Regla dura nueva: sobre la superficie de fase no se pinta ningún color semántico ni el acento.** "Guardado" es un éxito y §3.1 dice que el éxito es verde — pero verde `--success` sobre coral o cian tiene contraste impredecible y, encima, `--success` claro (`#147A46`) sobre `#C4441F` es ilegible. La regla que resuelve el choque, y que queda establecida para toda la app: **los semánticos y el acento solo aparecen sobre superficies neutras montadas encima** (diálogos, hojas, toasts), **nunca sobre el color de fase**. Es la contracara exacta de §3.1: así como las fases no salen de Modo entrenar, los semánticos no entran a la superficie de fase.

Esto no viola "ningún estado se comunica solo por color" (§15): acá **ningún estado se comunica por color en absoluto**. Los tres se leen por ícono y por palabra, en escala de grises y en lector de pantalla.

### 12.5 Por qué ese texto

**"Sin conexión · se guarda al reconectar"**

- **"Sin conexión"** nombra la causa en el idioma del usuario, no del sistema. Nada de "modo offline", "desconectado del servidor" ni códigos (§14).
- **"se guarda al reconectar"** es la mitad que importa: es la promesa que baja la alarma y es literalmente lo que pide `docs/screens.md` §5 ("indica que la sincronización queda pendiente"). Está en voz pasiva impersonal y en futuro implícito: la app se hace cargo, el usuario no tiene nada que hacer.
- **No dice "el timer sigue andando".** Sería defensivo y redundante: el número está contando a 88px arriba de la píldora, y esa es una prueba más fuerte que cualquier frase. El texto tiene que cargar lo que el número no puede decir.
- **No lleva signos de exclamación, ni ícono de alerta triangular, ni la palabra "error".** No hubo error.

A 375px la cadena entra en una sola línea con margen: ~247px de texto + 20px de ícono + 8px de gap + 24px de padding ≈ 300px, contra 343px disponibles.

### 12.6 Ciclo de vida y temporización

| Momento | Comportamiento |
|---|---|
| **Se cae la red** | La píldora aparece con un **fade de opacidad de 200ms** (§9). **Nunca entra deslizándose ni escalando:** el slot ya está reservado, así que no hay nada que desplazar, y un movimiento en la visión periférica durante un intervalo de trabajo distrae |
| **Mientras no hay red** | Permanece, sin parpadear, sin pulsar y sin animarse. Sigue visible detrás del backdrop del diálogo de salida (§7.3), igual que el número |
| **Vuelve la red, sin nada en cola** | La píldora se va con un fade de 200ms. **No se muestra "Guardado":** no se guardó nada, y confirmar un guardado inexistente es mentir |
| **Vuelve la red, con algo en cola** | Pasa a **"Sincronizando"** (mínimo **1s** en pantalla aunque el envío tarde 80ms) → **"Guardado"** durante **3s** → fade de salida de 200ms |
| **Anti-parpadeo** | Una vez visible, la píldora se queda **como mínimo 2s**, y solo se retira tras **2s de red estable**. Con señal intermitente en un gimnasio, un elemento que aparece y desaparece cada 400ms arriba de la pantalla es peor que la información que transmite |
| **Cambio de variante** | El contenido hace **cross-fade de 200ms**; el **ancho de la píldora salta, no se anima**. Una caja que se estira sola en la visión periférica llama más la atención que el propio mensaje — misma lógica por la que el timer no anima (§4.2) |
| **`prefers-reduced-motion: reduce`** | La flecha de "Sincronizando" **no gira**: en su lugar el ícono pulsa opacidad 100% ↔ 45% cada 1s. Nada rota, se desplaza ni escala (§9) |

**La franja solo habla de conectividad, no de resultados del backend.** Si hay red y la sincronización igual falla, **no se pinta un error acá**: el usuario está entrenando, no puede hacer nada al respecto, y no es su problema en ese momento. El pendiente sigue en cola y se resuelve fuera de esta pantalla. *(La superficie donde se muestra un pendiente que no pudo subir es un **agregado no solicitado — confirmar**: excede el brief y toca una pantalla que no es esta.)*

### 12.7 En el estado "Listo para empezar"

La sub-pantalla previa al inicio (`docs/screens.md` §5, estado "Listo para empezar") **no tiene color de fase**: es una superficie neutra. Ahí la misma píldora usa la **variante neutra**, y va **12px debajo del título**, alineada a la izquierda como el resto de esa columna (no centrada: es una página en flujo normal, no la pantalla del timer).

| Propiedad | Valor |
|---|---|
| Relleno | `--surface-2` (los dos modos) |
| Borde | 1px `--border` |
| Texto e ícono | `--text-muted` (claro 5.9:1 sobre `--surface-2`; oscuro 8.1:1) |

Todo lo demás —geometría, textos, íconos, ciclo de vida— es idéntico. Saber que no hay red **antes** de tocar "Iniciar" vale más que saberlo después.

### 12.8 Prohibido acá

1. Usar el toast para esta condición, o cualquier otra condición persistente.
2. Carmesí, ámbar, verde o violeta dentro de la franja o de la píldora, en cualquier variante.
3. Ícono de alerta triangular, exclamaciones, o la palabra "error" / "falló" para una caída de red.
4. Una X de descarte, un "Reintentar" o cualquier otro target dentro de la franja.
5. Animar el ancho de la píldora, hacerla parpadear, pulsar o entrar deslizándose.
6. Atenuar, achicar, tapar o desplazar el número del timer por culpa del indicador.
7. Colapsar la franja cuando está vacía.

### 12.9 Contención responsive

**La franja no cambia de disposición**: mismo lugar, mismo contenido, mismo texto en compacto y en amplio. Lo único que cambia es la escala (32→36px de alto de píldora, 13→14px de texto, 40→48px de franja), y se cambia con el prefijo `wide:`, el único umbral permitido (§8.1).

| Invariante (§8.4) | Cómo se cumple acá |
|---|---|
| **1 · Sin scroll horizontal del `body`** | La píldora tiene `max-width: calc(100% - 32px)` y su texto es una cadena fija verificada a 375px (~300px de 343 disponibles). No hay ancho fijo, no hay contenido variable del usuario adentro |
| **2 · Modales completos y scrolleables** | No aplica: el indicador no abre ninguna superficie. El diálogo de salida (§7.3) no se modifica y la píldora queda detrás de su backdrop |
| **3 · Ninguna acción inalcanzable** | **No aplica por construcción:** la franja no contiene ninguna acción. Y la píldora no puede tapar los controles porque vive en el flujo, arriba del `flex-1` del timer, nunca en posición absoluta |
| **4 · Las superficies anchas scrollean en sí mismas** | No aplica: la píldora no scrollea ni recorta. Si un texto futuro no entrara a 375px, **se acorta el texto**; no se agrega scroll ni elipsis |

Presupuesto vertical a 375×667, el caso más apretado: safe-area + 16 + header 44 + 8 + franja 40 + controles (72 + 12 + 48) + 24 = ~264px, quedan ~400px para el bloque del timer, que necesita ~200px. Entra cómodo.

### 12.10 Accesibilidad

- La franja es una región `role="status"` con `aria-live="polite"`, y **vive fuera de la región `aria-live` del timer**. Si estuviera adentro, cada transición de fase volvería a anunciar "Sin conexión".
- El texto es **texto real**, no un `aria-label` que duplique o contradiga lo visible. El ícono va `aria-hidden`.
- **Ningún estado depende del color** — las tres variantes se distinguen por ícono y por palabra (§12.4).
- **No hay mínimo de target porque no hay target:** nada en la franja es tocable ni focalizable, así que no entra en el orden de tabulación ni compite con el botón de volver.
- Tamaño de texto: 13px en compacto, por encima del piso de 12px (§4.4).
- Contrastes verificados en §12.3 (piso 5.1:1) y §12.7.

### 12.11 Checklist de aceptación visual

1. **Aparición:** al cortar la red, la píldora aparece arriba, centrada, debajo del header, **y el número del timer no se mueve ni un píxel**.
2. **Espacio reservado:** con conexión, la franja está vacía pero el número está a la misma altura exacta que cuando la píldora está visible.
3. **Las tres fases:** con la píldora visible, avanzar de preparación → trabajo → descanso: en las tres el texto de la píldora se lee cómodo y la píldora se distingue del fondo. Repetir en modo claro y en modo oscuro (6 combinaciones).
4. **Herencia de color:** el texto de la píldora es siempre del mismo color que la etiqueta de fase y que el número. Nunca hay un color propio.
5. **Neutralidad semántica:** ninguna variante muestra verde, carmesí, ámbar ni violeta, en ningún modo.
6. **Texto exacto:** dice `Sin conexión · se guarda al reconectar`, en una sola línea, sin cortarse a 375px.
7. **Nada tapado:** la píldora no se superpone al número, ni al nombre del bloque del header, ni a los botones de abajo, en 375px y en 1440px.
8. **Sin acción:** la píldora no responde al toque, no tiene X y no recibe foco con Tab.
9. **Reconexión sin cola:** al volver la red sin nada pendiente, la píldora se va con un fade y **no** aparece "Guardado".
10. **Reconexión con cola:** al volver la red con algo pendiente, se ve "Sincronizando" al menos un segundo, después "Guardado" unos tres segundos, y después nada.
11. **Anti-parpadeo:** cortando y restaurando la red rápido varias veces, la píldora no estrobea.
12. **Movimiento:** con `prefers-reduced-motion: reduce`, la flecha de "Sincronizando" no gira y nada se desplaza.
13. **Diálogo de salida:** con la píldora visible, tocar volver muestra el diálogo y la píldora sigue visible detrás del backdrop.
14. **Antes de empezar:** sin red, la pantalla "Listo para empezar" muestra la misma píldora en variante neutra (`--surface-2` + borde + texto gris), debajo del título y alineada a la izquierda.

---

## 13. Agrupación del historial por semana y día

Spec de la Fase 4 (RF-014, RN-012). Lo funcional está cerrado en `docs/requirements.md` y `docs/screens.md` §7 y no se redefine acá: el historial se agrupa **por semana de lunes a domingo** y, dentro de cada semana, **por día calendario** determinado con la hora local del dispositivo; cada entrada abre el **snapshot congelado** (RN-001); **no hay edición ni borrado**. Lo que esta sección fija es **cómo se ve esa estructura de tres niveles** y, sobre todo, **cómo se reparte la fecha entre ellos**.

### 13.1 El principio: un solo nivel enuncia la fecha

Agrupar crea tres niveles apilados —semana, día, entrada— y cada uno tiene una excusa razonable para escribir la fecha. Hacerlo sería el error central de esta pantalla: *"Semana del 18 al 24 de agosto" / "Lunes 18 de agosto" / "18 de agosto de 2026, 19:30"* dice tres veces lo mismo en 60px de alto, y obliga a leer las tres para descubrir que no aportan nada nuevo (§1, silencio visual; carga cognitiva).

**Regla: el encabezado de día es el único nivel que enuncia la fecha completa.**

| Nivel | Qué dice | Qué NO dice |
|---|---|---|
| **Semana** | El tramo de tiempo: `Esta semana` o `Semana del 18 al 24 de agosto` | Nunca el día de la semana ni la hora |
| **Día** | La fecha: `Lunes 18 de agosto` | Nunca el año (lo lleva la semana, y solo cuando hace falta) ni la hora |
| **Entrada** | La rutina y **la hora**: `Piernas y core` · `19:30` | **Nunca la fecha.** La tiene 8px más arriba |

De esta regla salen dos consecuencias que se aplican sin excepción:

- **La tarjeta pierde la fecha que hoy muestra** y se queda solo con la hora. Es lo que hace que agrupar sirva para algo: si la tarjeta sigue siendo autosuficiente, los encabezados son decoración.
- **El encabezado de día nunca es relativo** ("Hoy", "Ayer"). Es el único nivel que enuncia la fecha —así lo fija la regla de arriba y así lo recoge RF-014—: si dijera "Hoy", la fecha desaparecería de la pantalla. El encabezado de **semana** sí puede ser relativo justamente porque el día de abajo siempre tiene el dato duro.

### 13.2 Jerarquía: la contención dice el nivel, el tamaño dice la prioridad

El encabezado de semana es **más grande** que la tarjeta, y el de día es **más chico** que la tarjeta. No es una inconsistencia: son dos ejes distintos.

- **El nivel de anidamiento se comunica por posición y contención:** los dos encabezados viven **fuera** de toda tarjeta, sobre el fondo `--bg`, alineados al borde izquierdo de la columna; la entrada es una caja `--surface` con borde. Lo que está en una caja es contenido; lo que está sobre el fondo, rotula.
- **El tamaño refleja prioridad de lectura:** la semana es el ancla con la que se navega meses de historial y por eso es lo primero que se ve; el día es un rótulo de orientación que se lee de reojo; el nombre de la rutina es el dato que el usuario vino a buscar dentro de cada tarjeta.

| Nivel | Tipografía | Color | Vive sobre |
|---|---|---|---|
| **Semana** | Inter **20 / 26, peso 600** (`h2`) | `--text` | `--bg` |
| **Día** | Inter **13 / 18, peso 600**, `+0.02em` (`label`) | `--text-muted` | `--bg` |
| **Entrada — rutina** | Inter **17 / 24, peso 600** (`h3`) | `--text` | `--surface` |
| **Entrada — hora** | Inter **12 / 16, peso 500**, `tabular-nums` (`caption`) | `--text-muted` | `--surface` |

**Por qué la rutina es `h3` y no `h2`,** aunque §4.4 asigne `h2` al "nombre de rutina en tarjeta": en **Mis rutinas** ese nombre es el contenido principal de la pantalla y no tiene nada por encima; acá la tarjeta es una hoja colgada de dos niveles de agrupación, y 20px la empataría con el encabezado de semana, que es exactamente la distinción que esta pantalla necesita sostener. Es la única excepción a esa fila de la escala y no se extiende a ninguna otra pantalla.

**Toda la jerarquía es neutra.** Ni el acento ni ningún semántico entran en esta pantalla: el color no distingue niveles, y "Esta semana" no es un estado activo de navegación (§3.1).

### 13.3 Encabezado de semana

| Propiedad | Valor |
|---|---|
| Texto | `Esta semana` (semana en curso) · `Semana del 18 al 24 de agosto` (cualquier otra) |
| Tipografía | Inter 20 / 26, peso 600 · color `--text` |
| Alineación | Izquierda, al borde de la columna de contenido |
| Fondo | `--bg` **opaco** (lo necesita por ser sticky, §13.7). Sin blur, sin transparencia |
| Padding | `12px 0` |
| Borde / sombra | **Ninguno**, en ningún modo ni estado |
| Interactividad | **Ninguna.** No colapsa, no filtra, no navega |

**Formato de la fecha** (`es-AR`, meses en minúscula como manda el idioma):

| Caso | Texto |
|---|---|
| Semana en curso | `Esta semana` |
| Semana dentro de un mismo mes | `Semana del 18 al 24 de agosto` |
| Semana que cruza de mes | `Semana del 28 de julio al 3 de agosto` |
| Semana de otro año | `Semana del 16 al 22 de diciembre de 2025` |
| Semana que cruza de año | `Semana del 29 de diciembre de 2025 al 4 de enero de 2026` |

**El año aparece solo cuando el tramo no pertenece al año en curso**, y se pega al extremo cuyo año difiere. Un año escrito en todos los encabezados es ruido permanente para desambiguar algo que casi nunca está ambiguo.

**Por qué "Esta semana" y por qué solo esa:** la semana en curso es la única que todavía **se está llenando** —el usuario puede sumarle un entrenamiento hoy mismo—, y es la que mira el 90% de las veces que abre la pantalla. Nombrarla con un rango de fechas la obliga a hacer aritmética para reconocer el presente. Las demás son historia cerrada y se identifican por su fecha.

**"Semana pasada" queda descartado a propósito.** Sumaría un tercer formato (`Esta semana` / `Semana pasada` / `Semana del 11 al 17 de agosto`) y el usuario tendría que aprender dónde termina lo relativo y empieza lo absoluto. Con una sola etiqueta relativa la regla es trivial: **la de arriba de todo es la actual; el resto tiene fecha.**

**Sin rango de fechas al lado de "Esta semana".** Los días de abajo ya lo dicen, uno por uno (§13.1).

### 13.4 Encabezado de día

| Propiedad | Valor |
|---|---|
| Texto | `Lunes 18 de agosto` — día de la semana con inicial mayúscula, día en número, mes en minúscula, **sin año** |
| Tipografía | Inter 13 / 18, peso 600, `letter-spacing: +0.02em` · color `--text-muted` |
| Caja | Sin fondo, sin borde, sin padding. Es texto sobre `--bg` |
| Sticky | **No** (§13.7) |
| Interactividad | Ninguna |

**No va en mayúsculas sostenidas.** El nivel `label` de §4.4 pide peso 600 y `+0.02em`, no versalitas: `LUNES 18 DE AGOSTO` es una cadena larga en un formato que se lee más lento y que además se parece a un encabezado de tabla, que no es lo que esto es. La mayúscula inicial del día de la semana alcanza para marcar el arranque del grupo.

**El día de la semana está escrito con todas las letras y va primero** porque es el dato con el que el usuario recuerda un entrenamiento ("el martes hice piernas"), no el número.

**El día calendario es literal:** un entrenamiento terminado a las 00:30 pertenece a ese día, no al anterior. No existe ninguna heurística de "el día de entrenamiento termina a las 4 AM" (RN-012 no la habilita y sería una regla invisible).

### 13.5 La tarjeta de entrada

Conserva la forma que ya tiene y cambia solo su contenido de texto y su tipografía.

| Propiedad | Valor |
|---|---|
| Caja | `--surface`, borde 1px `--border`, radio `--r-lg`, ancho completo de la columna |
| Disparador | `<button>` de ancho completo, padding **12px 16px**, alto mínimo 44px (en la práctica ~64px con las dos líneas), texto alineado a la izquierda |
| Línea 1 | Nombre de la rutina: Inter 17 / 24, peso 600, `--text`, `overflow-wrap: anywhere` |
| Línea 2 | Hora en formato **24h `HH:mm`** (`19:30`): Inter 12 / 16, peso 500, `--text-muted`, `tabular-nums` (§4.3), 2px debajo de la línea 1, con etiqueta visualmente oculta `Hora: ` |
| Chevron | Ícono de trazo 24px, `--text-muted`, área tocable **44×44**, al extremo derecho, centrado verticalmente respecto de la fila cerrada |
| Panel abierto | Sin cambios respecto de lo actual: borde superior 1px `--border`, padding 12px 16px, y el equipo congelado con los chips de §11.2–§11.5 |

**La hora se muestra siempre**, incluso cuando el día tiene una sola entrada. Mostrarla condicionalmente haría que la tarjeta cambiara de alto según el día, y el usuario no tendría forma de saber por qué. Con 12px muted y `tabular-nums` cuesta 16px de alto y desambigua el caso de §13.8.

**El chevron es un agregado no solicitado — confirmar.** No agrega ninguna acción: la tarjeta ya es expandible hoy (tiene `aria-expanded`) pero **nada en pantalla lo dice**, así que se lee como una tarjeta muerta y el snapshot queda escondido detrás de un toque que el usuario no sabe que existe (affordance, §1). El chevron apunta hacia abajo cerrado y hacia arriba abierto; la rotación es de **120ms `ease-out`** (§9), y con `prefers-reduced-motion: reduce` **no rota**: se cambia el ícono sin transición.

**Los siete estados del disparador (§6.2):**

| Estado | Forma |
|---|---|
| Reposo | `--surface` + borde `--border` |
| Hover | Fondo `--surface-2` (los dos modos) |
| Foco | Anillo 2px `--accent`, offset 2px, sobre la tarjeta entera |
| Presionado | Escala 0.98 |
| Deshabilitado | **No aplica: nunca se deshabilita** |
| Cargando | **No aplica:** el snapshot llega junto con el listado, así que abrir no dispara ninguna llamada |
| Error | **No aplica** a la tarjeta; el error de carga es de pantalla (§13.9) |

**El estado abierto no se comunica por color:** lo dicen el chevron y el panel visible.

### 13.6 Ritmo vertical

Todos los valores declarados están en la escala de §5.2 (`4, 8, 12, 16, 20, 24, 32…`).

| Elemento | Separación |
|---|---|
| Grupo de semana | `margin-top: 32px` — **0 el primero** (queda el gap de 24px que ya lo separa del título "Historial") |
| Encabezado de semana | `padding: 12px 0` (los 12px de arriba son además el respiro cuando queda pegado, §13.7) |
| Grupo de día | `margin-top: 20px` — **4px el primero** de cada semana |
| Encabezado de día → primera tarjeta | `8px` |
| Entre tarjetas del mismo día | `12px` (§5.2) |
| Final de la lista | `96px` de espacio libre (§8.3) |

La escalera importa más que los números sueltos: **32 (semana) > 20 (día) > 12 (entre tarjetas) > 8 (encabezado y sus tarjetas)**. El aire *encima* de un encabezado siempre es mayor que el aire *debajo*, así que por proximidad (Gestalt) el rótulo se lee pegado a lo que rotula y separado de lo que quedó arriba. Si esa relación se invierte en cualquier punto, la agrupación se lee al revés y no hay tipografía que la salve.

### 13.7 Sticky: la semana sí, el día no

**El encabezado de semana es sticky. El de día no.**

| Propiedad | Valor |
|---|---|
| `position` | `sticky` |
| `top` | **0** en compacto (no hay barra superior) · **56px** en amplio (alto de la barra superior fija, §7.2) |
| Fondo | `--bg` opaco. Sin blur (§7.1: en movimiento el contenido de atrás ensucia el texto) |
| Borde / sombra | Ninguno. La tarjeta que pasa por debajo se corta contra un fondo casi del mismo valor (`--surface` sobre `--bg` es un salto mínimo en los dos modos), así que el corte se lee suave y no necesita una línea que lo explique |
| Apilamiento | Por encima de las tarjetas y **por debajo** de la barra de navegación |

**Por qué la semana sí:** es el único rótulo que responde "¿dónde estoy?" cuando el usuario tira del scroll hacia atrás buscando un mes viejo. Sin fijarlo, la respuesta puede quedar a una pantalla y media de distancia y hay que frenar y volver. Cuesta 42px de banda superior, el mismo orden de magnitud que ya se aceptó para la franja de estado de §12.2.

**Por qué el día no:**

- Dos encabezados pegados se apilan y se convierten en una **barra de herramientas de ~70px** que ninguna de las dos cosas es; en 375×667 eso es el 11% del alto útil, permanente.
- Un grupo de día tiene casi siempre **una sola tarjeta**: el rótulo quedaría pegado más tiempo del que dura su contenido, y se leería como si rotulara la tarjeta del día siguiente. Un rótulo que miente sobre lo que tiene debajo es peor que no tenerlo.
- Es texto de 13px `--text-muted`: fijado sobre tarjetas que se deslizan, se lee como resto, no como estructura.

**Alternativa evaluada y descartada:** nada sticky. Es más simple y no cuesta altura, pero pierde el único beneficio real de agrupar un historial largo —poder recorrerlo sin perder la referencia temporal—, y deja la pantalla igual de plana que antes salvo por unos rótulos intercalados.

### 13.8 Casos límite

| Caso | Resolución |
|---|---|
| **Semana con un solo día con actividad** | **Se dibujan los dos encabezados igual.** El nivel nunca se colapsa "porque hay uno solo": es la misma lógica de §11.1 (un grupo de un elemento sigue siendo una caja). Una estructura que cambia de forma según cuánto contiene obliga a re-interpretarla en cada scroll |
| **Día con un solo entrenamiento** | Igual: encabezado de día siempre presente, con su hora en la tarjeta |
| **Día con varios entrenamientos** | **El modelo lo permite** (`data-model.md` §2.9: nada limita la cantidad de `WorkoutLog` por día, ni siquiera repetir el mismo día de la misma rutina). Se apilan varias tarjetas bajo el mismo encabezado de día, separadas 12px, **ordenadas por hora descendente**. Si dos entradas son de la misma rutina y el mismo día, **la hora es lo único que las distingue**: por eso es obligatoria (§13.5) |
| **Semanas sin actividad entre dos con actividad** | **No se dibujan.** El historial es el registro de lo que pasó, no un calendario: un encabezado con nada debajo sería un vacío mudo (§6.4), y una pausa de seis meses generaría 26 encabezados huecos que hay que scrollear |
| **Orden general** | Semanas descendentes, días descendentes dentro de la semana, entradas descendentes dentro del día. Un solo eje temporal, siempre lo más reciente arriba, coherente con el orden que ya devuelve el backend |
| **Resumen o conteo por semana** ("3 entrenamientos") | **No se incluye.** Excede el brief y empuja hacia una lectura de puntaje semanal que §13 (voz) descarta. Si se quisiera, se decide aparte |

### 13.9 Estados de pantalla

- **Cargando:** el esqueleto toma la forma del contenido real (§6.4) y por lo tanto **incluye los encabezados**: una barra de 20px de alto al 45% del ancho (semana), una de 14px al 30% (día), dos tarjetas, y un segundo bloque de día con una tarjeta. Respeta el ritmo de §13.6. Un esqueleto de tarjetas planas prometería una pantalla que ya no existe.
- **Vacío:** sin ningún encabezado. Se mantiene el estado vacío de §6.4 con el texto ya definido en `docs/screens.md` §7. **Corrección al estado actual:** la acción que lo resuelve ("Ir a Mis rutinas") va como **botón primario dentro del bloque vacío**, no como link de texto suelto debajo — §6.4 lo pide explícitamente y hoy no se cumple.
- **Error:** sin encabezados; el bloque de error con reintento ocupa el lugar de la lista.
- **Con datos:** lo especificado en §13.2–§13.7.

### 13.10 Contención responsive

| | Compacta (375–1023px) | Amplia (≥1024px) |
|---|---|---|
| Columnas de tarjetas | 1 | **1** (excepción, ver abajo) |
| Tarjeta | Dos líneas apiladas: rutina arriba, hora debajo | **Una línea:** rutina a la izquierda, hora alineada a la derecha, chevron al extremo |
| `top` del encabezado sticky | 0 | 56px |
| Tipografía de los tres niveles | Sin cambios | Sin cambios |

**El historial es la excepción a "listas = 2 columnas en amplio" de §8.5.** Dos columnas obligan a un barrido en Z dentro de cada día, y el historial tiene un solo eje: el tiempo. Además, un día tiene casi siempre una entrada, así que la grilla quedaría medio vacía en casi todas las filas. §8.5 queda actualizada con esta excepción. El ancho sobrante en amplio se aprovecha llevando la hora al extremo derecho de la tarjeta, no metiendo una segunda columna.

| Invariante (§8.4) | Cómo se cumple acá |
|---|---|
| **1 · Sin scroll horizontal del `body`** | Los encabezados son texto que envuelve; el nombre de rutina usa `overflow-wrap: anywhere`; ninguna caja tiene ancho fijo. La cadena más larga prevista (`Semana del 29 de diciembre de 2025 al 4 de enero de 2026`) **envuelve a dos líneas** a 375px, y el encabezado sticky crece con ella: no se trunca, no se elide y no se achica la tipografía |
| **2 · Modales completos y scrolleables** | No aplica: el detalle se expande **en línea**, no en modal |
| **3 · Ninguna acción inalcanzable** | El encabezado sticky **no contiene ninguna acción**, así que no puede tapar ninguna; la lista conserva los 96px libres al final (§8.3) para que la última tarjeta y su detalle abierto queden por encima de la barra inferior |
| **4 · Las superficies anchas scrollean en sí mismas** | No aplica a la agrupación. Adentro del panel abierto, la línea de equipo sigue la regla de §11.9: envuelve, nunca scrollea |

### 13.11 Accesibilidad

- **Estructura de encabezados real:** `h1` "Historial" → `h2` por semana → `h3` por día. Quien navega por encabezados recorre el historial por tramos sin escuchar tarjeta por tarjeta. El nombre de la rutina **no** es un encabezado: vive dentro del botón que expande.
- Cada grupo de semana y de día es una región rotulada por su encabezado, de modo que el lector de pantalla anuncia el contexto al entrar.
- La hora lleva la etiqueta visualmente oculta `Hora: ` (mismo patrón que `Equipo: ` de §11.10) y se lee `19:30`.
- **Nada depende del color:** los tres niveles se distinguen por tamaño, peso, posición y contención. En escala de grises la jerarquía se mantiene entera.
- Contrastes: `--text` sobre `--bg` ≥ 15:1 en los dos modos; `--text-muted` sobre `--bg` ≥ 5.5:1 en los dos modos (§11.10), por encima del 4.5:1 de texto normal aun a 12px.
- El encabezado sticky **no es focalizable** y no entra en el orden de tabulación. Al tabular hacia una tarjeta que quedó debajo de la banda, el navegador la desplaza a la vista: por eso la banda no lleva sombra ni alto extra que agrande la zona ciega.
- Targets: el disparador de la tarjeta ocupa el ancho completo con ~64px de alto; el chevron vive **dentro** de ese mismo botón (no es un segundo target adyacente que compita con él).

### 13.12 Prohibido acá

1. Repetir la fecha en la tarjeta de entrada. La tarjeta muestra hora, nunca fecha.
2. Etiquetas relativas en el encabezado de **día** ("Hoy", "Ayer").
3. Un segundo formato relativo de semana ("Semana pasada", "Hace 2 semanas").
4. Omitir el encabezado de semana o de día cuando el grupo tiene un solo hijo.
5. Dibujar semanas sin actividad.
6. Fijar (sticky) el encabezado de día, o apilar dos encabezados fijos.
7. Teñir cualquiera de los dos encabezados con el acento o con un semántico, incluida la semana en curso.
8. Encabezados con fondo distinto de `--bg`, con blur, con borde permanente o con sombra.
9. Truncar con elipsis un encabezado de semana largo, o bajarle el tamaño para que entre.
10. Convertir un encabezado en control (colapsar la semana, filtrar por semana, borrar el grupo).

### 13.13 Checklist de aceptación visual

1. **Tres niveles:** con al menos dos semanas de datos se ven encabezados de semana, encabezados de día y tarjetas, en ese orden de anidamiento y con la semana más reciente arriba.
2. **La fecha se dice una sola vez:** ninguna tarjeta muestra la fecha; solo el nombre de la rutina y la hora `HH:mm`.
3. **Semana en curso:** el primer encabezado dice exactamente `Esta semana`, sin rango de fechas al lado.
4. **Semanas pasadas:** dicen `Semana del 18 al 24 de agosto`; una semana que cruza de mes nombra los dos meses; una de otro año incluye el año.
5. **Día:** dice `Lunes 18 de agosto`, con la inicial en mayúscula, en minúsculas el resto, **sin año** y **sin mayúsculas sostenidas**.
6. **Jerarquía:** el encabezado de semana es visiblemente más grande que el nombre de la rutina, y el de día visiblemente más chico y más gris. Se verifica igual en modo claro y en modo oscuro.
7. **Ritmo:** el aire por encima de cada encabezado es mayor que el aire por debajo; las tarjetas de un mismo día están más juntas entre sí que respecto del encabezado del día siguiente.
8. **Sticky:** al scrollear, el encabezado de semana queda pegado arriba con fondo opaco (en amplio, justo debajo de la barra superior) y las tarjetas pasan por debajo sin verse a través de él. El encabezado de día **no** queda pegado.
9. **Un solo día:** una semana con un único día con actividad muestra igual sus dos encabezados.
10. **Varias entradas en un día:** dos entrenamientos del mismo día aparecen como dos tarjetas bajo un único encabezado de día, ordenadas de más reciente a más antiguo, distinguibles por la hora aunque la rutina sea la misma.
11. **Sin huecos:** entre dos semanas con actividad separadas por semanas vacías no aparece ningún encabezado sin contenido.
12. **375px:** el encabezado de semana más largo envuelve a dos líneas sin generar scroll horizontal, sin elipsis y sin cambiar de tamaño.
13. **Amplio:** una sola columna de tarjetas; la hora aparece alineada a la derecha, en la misma línea que el nombre de la rutina.
14. **Neutralidad:** ningún encabezado usa violeta, verde, carmesí ni ámbar en ningún modo.
15. **Esqueleto:** el estado de carga muestra barras con forma de encabezado de semana y de día, no solo tarjetas.
16. **Vacío:** sin ningún entrenamiento no se dibuja ningún encabezado, y el CTA "Ir a Mis rutinas" es un botón primario dentro del bloque vacío.
17. **(Si se confirma el chevron) Affordance:** cada tarjeta muestra un chevron que apunta hacia abajo cerrada y hacia arriba abierta; con `prefers-reduced-motion: reduce` cambia sin rotar.

---

## 14. Voz de la interfaz

- **Español rioplatense, voseo, segunda persona.** "Empezá", "Guardá", "Agregá un bloque".
- Botones con el **verbo real** de la acción, nunca "Aceptar"/"OK" en decisiones con consecuencia.
- Errores que dicen **qué pasó y qué hacer**, nunca códigos ni jerga: "No se pudo guardar la rutina. Revisá la conexión y probá de nuevo".
- Sin exclamaciones motivacionales, sin gamificación, sin felicitaciones efusivas. Al terminar una rutina se muestra el resultado, no una fiesta.
- Nunca hay texto que implique a otras personas ("tus amigos", "compartí", "ranking"). La app es de uno.

---

## 15. Prohibiciones (resumen ejecutable)

1. Numerales del timer en tipografía que no sea mono + tabular.
2. Verde, rojo o ámbar usados para algo que no sea éxito, destructivo/error o advertencia.
3. El acento violeta tiñendo datos, estados, fases o categorías.
4. Colores de fase (`--phase-*`) fuera de Modo entrenar.
5. Semánticos usados como fondo a sangre completa.
6. Cualquier estado comunicado **solo** por color.
7. Targets por debajo de 44×44px.
8. Texto por debajo de 12px.
9. Breakpoints de disposición que no sean `--bp-wide`.
10. Sidebar o cualquier navegación lateral persistente.
11. Superficies, textos o íconos que impliquen otros usuarios.
12. Specs que declaren un solo modo de color, o que no declaren su comportamiento en compacto.
13. Chips de equipo teñidos con el acento o con un semántico, "Sin equipo" dibujado como chip, o la relación Y/O expresada con un glifo (`+`, `&`, `/`) en lugar de la palabra.
14. Colores semánticos o acento pintados **sobre la superficie de fase** de Modo entrenar. Los semánticos solo aparecen sobre superficies neutras montadas encima (diálogos, hojas, toasts).
15. Un toast usado para comunicar una **condición persistente** (sin conexión, sincronización pendiente). El toast es para eventos efímeros.
16. Un elemento que aparece o desaparece **desplazando el número del timer**. Todo indicador de Modo entrenar vive en un slot de alto reservado.
17. Decir la fecha más de una vez en el historial: la enuncia el encabezado de día y nadie más (§13.1).
18. Omitir un nivel de agrupación del historial porque tiene un solo hijo, dibujar semanas sin actividad, o fijar (sticky) el encabezado de día (§13.7, §13.8).

---

## Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-08-25 | Acento de marca = violeta eléctrico | Máxima separabilidad respecto de los tres semánticos, incluida visión con daltonismo rojo-verde; no se confunde con azul de sistema |
| 2026-08-25 | Semánticos = verde / carmesí / ámbar, reservados estrictamente | Convención universal; cualquier otra asignación obliga al usuario a aprender un código propio |
| 2026-08-25 | Fases del timer con paleta propia (coral / cian), separadas de los semánticos por escala de uso | Impide que "trabajo" se lea como "error"; el par cálido/frío se distingue de reojo y por luminosidad |
| 2026-08-25 | Inter (UI) + JetBrains Mono (timer, tabular) | Legibilidad a tamaño chico y dígitos que no bailan al cambiar |
| 2026-08-25 | `--bp-wide = 1024px`, umbral único | Coincide con `lg` de Tailwind; una tablet en vertical se sigue tocando con el pulgar y merece disposición compacta |
| 2026-08-25 | Navegación cambia de forma en amplio: tabs inferiores → barra superior | En desktop desaparece el argumento del pulgar y el recurso escaso pasa a ser la altura; sin sidebar, decisión cerrada |
| 2026-08-25 | La navegación resta 0px de ancho al contenido en toda disposición | Es horizontal en los dos regímenes (inferior en compacto, superior en amplio) |
| 2026-08-25 | Sin pantalla de gate por debajo de 375px | Bloquear una app de gimnasio en un celular chico es peor que la degradación visual |
| 2026-08-25 | Modo de color: sigue al sistema por defecto; la elección manual se guarda y prevalece (RN-011) | Default sin fricción; el toggle mantiene dos posiciones, sin tercer estado "auto", y el modo se resuelve antes del primer pintado para evitar el flash blanco |
| 2026-08-25 | Toggle de tema: header de Mis rutinas en compacto, barra superior en amplio | No merece un slot de tab ni compite con las acciones contextuales de los otros headers; misma esquina en los dos regímenes |
| 2026-08-25 | Salir de Modo entrenar con el timer corriendo pide confirmación (RN-010) | Es el error irreversible más caro de la app; el default seguro es quedarse, y el timer sigue corriendo y visible durante el diálogo |
| 2026-08-26 | Un grupo de equipo se dibuja siempre como una caja, aun con un solo elemento (§11.1) | Una fila de chips sueltos se lee por convención como "O"; la caja hace visible el nivel del grupo sin que el usuario tenga que interpretar espacios |
| 2026-08-26 | La relación Y/O se comunica con las palabras `o` (adentro, minúscula) e `Y` (afuera, mayúscula), nunca con color ni glifo | Tres señales redundantes —contención, palabra y posición—; funciona en escala de grises, con daltonismo y en lector de pantalla, y usa el mismo vocabulario que la doc funcional |
| 2026-08-26 | "Sin equipo" se muestra como texto gris, nunca como chip (§11.5) | Un chip significa "necesitás esto"; dibujar la ausencia con la forma del requisito rompe la única convención que la pantalla enseña |
| 2026-08-26 | En el editor no hay botón "quitar grupo": el grupo muere con su último elemento, y "Agregar equipo" abre el selector de una (§11.6, §11.7) | Un solo control de quita evita dos caminos para el mismo resultado, y crear el grupo con su primer elemento hace que RN-014 se cumpla por construcción: el formulario nunca queda inválido por el equipo |
| 2026-08-26 | La línea de equipo envuelve y nunca scrollea en horizontal (§11.9) | Un requisito escondido fuera del borde derecho es una pérdida funcional: el usuario cree que sabe qué necesita y le falta el banco |
| 2026-08-26 | Chip neutro = dato; acento = control activo. El filtro por elemento no usa chips (§11.8, a confirmar) | Sin esa separación, los chips de filtro y los de equipo serían indistinguibles en la misma pantalla |
| 2026-08-26 | El estado "Sin conexión" de Modo entrenar es una **píldora de estado en una franja reservada**, no un toast ni un banner (§12.1, §12.2) | Es una condición persistente, no un evento; el visor de toasts se ancla al borde inferior, justo encima del par pausar/avanzar de ≥72px, y un banner sobredimensiona una noticia que es tranquilizadora |
| 2026-08-26 | La franja de estado reserva su alto siempre, esté vacía o no (§12.2) | El área del timer está centrada: si la franja apareciera de golpe, el número de 88px se correría justo mientras el usuario lo mira. §4.2 exige que el número no se mueva nunca |
| 2026-08-26 | La píldora hereda `currentColor` de la fase y se rellena con `--phase-veil` (negro 14% en claro, blanco 10% en oscuro) (§12.3) | Ningún color fijo sobrevive a las seis superficies de fase (el `fg` se invierte entre trabajo/descanso y preparación en claro); el velo empuja el fondo en dirección contraria al texto, así que **sube** el contraste en las seis (piso 5.1:1) |
| 2026-08-26 | **Sobre la superficie de fase no se pinta ningún semántico ni el acento** (§12.4, prohibición 14) | Contracara exacta de §3.1: así como las fases no salen de Modo entrenar, los semánticos no entran a la superficie de fase. Verde sobre coral es ilegible, y el estado se comunica igual por ícono y palabra |
| 2026-08-26 | Texto fijo: "Sin conexión · se guarda al reconectar"; sin "el timer sigue andando" (§12.5) | La segunda mitad es la promesa que baja la alarma y es lo que pide `screens.md` §5; que el timer anda ya lo prueba el número contando a 88px arriba de la píldora |
| 2026-08-26 | Sí hay estado transitorio "Sincronizando" → "Guardado" (3s), pero **solo si había algo en cola** (§12.6) | Una desaparición muda deja la duda "¿se guardó o perdí el indicador?"; confirmar un guardado que no ocurrió sería mentir |
| 2026-08-26 | Piso de 2s en pantalla y 2s de red estable antes de retirar la píldora (§12.6) | Con señal intermitente, un elemento que estrobea arriba de la pantalla molesta más de lo que informa |
| 2026-08-26 | En el historial **solo el encabezado de día enuncia la fecha**; la tarjeta pierde la fecha y muestra la hora (§13.1) | Con tres niveles apilados, la fecha se diría tres veces en 60px de alto; si la tarjeta sigue siendo autosuficiente, los encabezados son decoración |
| 2026-08-26 | Semana en curso = `Esta semana`; el resto, fecha explícita. Sin "Semana pasada" y sin etiquetas relativas a nivel de día (§13.3, §13.4) | Una sola etiqueta relativa deja una regla trivial ("la de arriba es la actual"); un segundo formato obligaría a aprender dónde termina lo relativo. El día no puede ser relativo porque es el único nivel que enuncia la fecha (§13.1): si dijera "Hoy", la fecha desaparecería de la pantalla |
| 2026-08-26 | Jerarquía del historial: semana `h2` `--text` > rutina `h3` > día `label` `--text-muted`; el encabezado de día es **más chico** que la tarjeta a propósito (§13.2) | La contención y la posición comunican el nivel de anidamiento; el tamaño comunica prioridad de lectura. El nombre de rutina baja a `h3` (única excepción a §4.4) para no empatar con el encabezado de semana |
| 2026-08-26 | El encabezado de semana es sticky; el de día no (§13.7) | La semana es el único rótulo que responde "¿dónde estoy?" al recorrer meses; dos encabezados fijos se apilan en una barra de ~70px, y un rótulo de día pegado sobrevive a su contenido (un día tiene casi siempre una tarjeta) |
| 2026-08-26 | Ningún nivel de agrupación se colapsa por tener un solo hijo, y las semanas sin actividad no se dibujan (§13.8) | Misma lógica que §11.1: una estructura que cambia de forma según cuánto contiene se re-interpreta en cada scroll. Y un encabezado sin contenido es un vacío mudo; seis meses de pausa serían 26 encabezados huecos |
| 2026-08-26 | El historial queda en **una columna también en amplio**, contra la regla general de §8.5 | Dos columnas imponen un barrido en Z dentro de cada día, y el historial tiene un solo eje: el tiempo. Además la grilla quedaría medio vacía casi siempre. El ancho extra se usa llevando la hora al extremo derecho de la tarjeta |
