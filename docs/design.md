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
| Listas (rutinas, historial) | 1 columna | 2 columnas |
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

## 11. Voz de la interfaz

- **Español rioplatense, voseo, segunda persona.** "Empezá", "Guardá", "Agregá un bloque".
- Botones con el **verbo real** de la acción, nunca "Aceptar"/"OK" en decisiones con consecuencia.
- Errores que dicen **qué pasó y qué hacer**, nunca códigos ni jerga: "No se pudo guardar la rutina. Revisá la conexión y probá de nuevo".
- Sin exclamaciones motivacionales, sin gamificación, sin felicitaciones efusivas. Al terminar una rutina se muestra el resultado, no una fiesta.
- Nunca hay texto que implique a otras personas ("tus amigos", "compartí", "ranking"). La app es de uno.

---

## 12. Prohibiciones (resumen ejecutable)

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
