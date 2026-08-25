# QA visual

Validación que ni los tests, ni el build, ni el e2e cubren: pixel, layout, modales cortados o atrapantes, marcas mal puestas, datos inválidos que se guardan. Se corre contra la app andando, en un navegador de escritorio.

**Quién ejecuta:** el orquestador lo corre él mismo contra el navegador conectado vía `/chrome` (herramientas `mcp__claude-in-chrome`) — navega, interactúa, dispara casos borde, saca screenshots y reporta. Si el navegador no está conectado/disponible en la sesión, cae al **fallback**: arma el prompt per-feature y se lo entrega al usuario para que lo corra en el chat de la extensión **Claude para Chrome**. La conexión de `/chrome` no es persistente: se reconecta en cada sesión nueva. En ambos modelos el guion es el mismo — cambia solo quién lo ejecuta.

**Sembrado de datos de prueba:** el orquestador **siembra la data que el caso requiera** cuando la cuenta conectada no tiene los casos necesarios para ejercitar la feature. Es **parte esperada** de correr el QA, no un paso extraordinario: sin los datos adecuados el recorrido no prueba nada.

**La base de datos local de desarrollo es descartable.** Sus datos no tienen valor. Al correr QA (o cualquier prueba), el orquestador **crea y modifica** libremente lo que necesite **sin pedir permiso** y **sin obligación de revertir** la data de prueba. La data no se trata como preciosa. Esto aplica **solo a la base local de desarrollo**, no a datos de producción.

**Interactuar es el guion, no una excepción:** en **localhost**, el orquestador **usa la app y envía formularios sin pedir confirmación por acción** — crear y guardar registros de prueba es exactamente lo que el QA pide. Pedir permiso antes de cada submit invalida el recorrido. El **borrado de datos** queda **fuera** del guion: lo hace el usuario.

**Límites (reglas de seguridad):** el orquestador **no crea cuentas de usuario, no ingresa credenciales/contraseñas ni realiza el login** (incluido OAuth) y **no borra datos** —ni siquiera la data que él mismo creó durante el guion—. Si una prueba requiere una sesión autenticada, la autenticación la resuelve el usuario; el borrado, también. El alta y la edición de datos las maneja el orquestador sin fricción.

El corte está en la reversibilidad: el borrado es irreversible, así que lo dispara el usuario. Todo el resto del guion —crear, editar, **anular/des-anular**, navegar— es reversible o no destructivo, y por eso lo ejecuta el orquestador sin confirmación. **Anular no es borrar:** es un caso reversible más y se ejercita con normalidad.

Este doc es un **asset de trabajo vivo**: el prompt genérico de regresión y la plantilla per-feature se mantienen acá al día con las superficies del producto.

**Valores responsive del proyecto:** ancho mínimo soportado **375px**; token del umbral **`--bp-wide`** (1024px); disposición compacta **375–1023px**. La navegación persistente le resta **0px de ancho** al contenido (ver `docs/design.md` §Contención responsive).

## Alcance y exclusiones

**Valida:**
- Roturas visuales de layout.
- Modales cortados o atrapantes (que no se cierran, que pierden datos al cerrar).
- Opciones inalcanzables (menús que se salen de pantalla, selects que tapan).
- Datos inválidos que se guardan.
- Estados vacíos rotos (NaN, undefined, empty feo).
- Crashes.
- **Contención responsive** — los cuatro invariantes de `docs/design.md` § Contención responsive, verificados entre el **ancho mínimo soportado (375px) y arriba** (incluyendo la disposición compacta, `< --bp-wide`, 375–1023px, además del amplio). Por debajo de 375px la app no promete contención y no se verifica.
  1. Sin scroll horizontal del `body` en todo ancho `≥ 375px`.
  2. Modales completos y scrolleables: no cortados, no atrapantes.
  3. Ninguna acción inalcanzable (fuera de pantalla o tapada).
  4. Las superficies anchas scrollean dentro de sí mismas, no rompen el layout de la página.

El grueso del recorrido va en **escritorio normal**; los cuatro invariantes de contención se verifican **siempre**, también achicando la ventana entre 375px y `--bp-wide` (disposición compacta). Por debajo de 375px no se verifica: no es un ancho soportado.

> **El régimen compacto/amplio se juzga directamente contra el viewport.** La navegación de Fit es una barra horizontal (inferior en compacto, superior en amplio), sin estado abierto/cerrado, y **no le resta ancho al contenido** en ninguna disposición: el ancho de `<main>` es el del viewport. No existe el caso "probar con la navegación abierta y cerrada". Lo que la navegación sí consume es **altura**, así que se verifica que el último elemento de toda pantalla scrolleable y los botones flotantes queden alcanzables por encima de la barra.

**Exclusiones vigentes** — se atacan como esfuerzos propios y **no** se incluyen en los prompts por ahora:
- **Adaptación / rediseño mobile:** evaluar si la experiencia en pantalla chica es *buena* o *cómoda*. Lo único que se verifica en pantalla chica es que **no se rompe** (los cuatro invariantes de contención, arriba); adaptar o rediseñar para mobile queda fuera.
- **Accesibilidad**: uso por teclado, foco, contraste, legibilidad, información transmitida solo por color.

## Prompt genérico de regresión adversarial

Doc vivo: cuando una feature agrega una superficie nueva, se agrega a la lista de superficies de este prompt, **en el mismo commit que el código**. El bloque de abajo es el asset a mantener y se pega tal cual.

---
Sos un QA senior con mentalidad adversarial. Tu objetivo NO es confirmar que la app anda: es ENCONTRAR maneras de romperla. La app se llama Fit, una app personal para armar rutinas de entrenamiento y ejecutarlas en tiempo real con un timer integrado (EMOM, AMRAP, intervalos, libre). Recorré todo, meté datos que no deberían entrar, forzá flujos raros, y documentá cada falla con screenshot y pasos para reproducir.

FUERA DE ALCANCE (ignoralo): adaptación/rediseño mobile —si la experiencia en pantalla chica es *cómoda* o *buena* no es tu problema— y accesibilidad (teclado, foco, contraste, legibilidad, info por color).

BORRADOS, A CARGO DEL USUARIO: los casos que borran datos (borrar una entidad en uso, eliminar registros) están dentro del alcance y hay que verificarlos, pero **el borrado lo ejecuta el usuario, no vos**. Enunciá el caso, pedile al usuario que dispare el borrado y verificá el resultado. No borrás nada, ni siquiera la data que creaste durante el guion. Crear, editar y **anular/des-anular** sí los hacés vos, sin pedir confirmación: son reversibles. Anular no es borrar.

DENTRO DE ALCANCE, SIEMPRE — contención responsive: además de probar en escritorio normal, achicá la ventana hasta 375px (el ancho mínimo soportado), pasando por la disposición compacta (375–1023px), y verificá los cuatro invariantes. No bajes de 375px: por debajo de ese ancho la app no promete contención y no se verifica. El régimen compacto/amplio se mide directo contra el viewport: la navegación es una barra horizontal (abajo en compacto, arriba en amplio), no tiene estado abierto/cerrado y no resta ancho al contenido. Lo que sí consume es altura: verificá que el último ítem de las pantallas scrolleables y los botones flotantes no queden tapados por la barra.
1. El `body` no tiene scroll horizontal en ningún ancho ≥ 375px.
2. Los modales se ven completos y scrollean: ni cortados ni atrapantes.
3. Ninguna acción queda fuera de pantalla ni tapada.
4. Las superficies anchas (tablas, grillas, gráficos) scrollean dentro de sí mismas sin romper el layout de la página.

Enfocate en: datos inválidos que se guardan, roturas visuales de layout, modales cortados, opciones inalcanzables, estados rotos y crashes.

Superficies (recorrelas todas): Mis rutinas (home: lista de rutinas, estado vacío, crear/editar/borrar/entrenar); Editor de rutina (agregar y reordenar días, encadenar bloques del pool o crearlos ad-hoc, validaciones de nombre único y de tiempos/reps > 0, descartar cambios); Pool de bloques, ejercicios y elementos (crear/editar/borrar con borrado lógico en los tres, bloqueo de borrado de un ejercicio en uso y de un elemento en uso con mensaje, configuración de tipo y timer del bloque, grupos de equipo de un ejercicio con requisitos fijos y grupos de alternativas —incluido el intento de dejar un grupo vacío—, filtro de ejercicios por elemento incluido "sin equipo" y su estado sin resultados); Modo entrenar (timer EMOM/AMRAP/intervalos/libre, pausar/reanudar/avanzar, avance automático vs. manual entre bloques, confirmación al salir con el timer corriendo, comportamiento offline, ancho completo en disposición amplia); Historial (lista agrupada por semana lunes-domingo y día calendario, detalle del snapshot inmutable, sin edición ni borrado); modal de selección rápida de ejercicio/bloque del pool (hoja inferior en compacto, diálogo centrado en amplio, búsqueda, pool vacío); toggle de tema claro/oscuro.
<!-- Se mantiene al día: cada feature que agrega una superficie la suma acá en el mismo commit que el código. -->

Mentalidad para romperla, por cada campo:
- Texto: vacío, solo espacios, 2000+ chars, emojis/unicode RTL, HTML/JS (`<script>`, `<img onerror>`) verificando que NO ejecute, comillas/backslashes/`{{7*7}}`/`'; DROP TABLE`/saltos de línea, espacios al borde, nombres duplicados, recrear con nombre de uno borrado (¿ofrece reactivar?).
- Numérico: 0, negativos, decimales largos, notación científica, números enormes (¿desborda?), letras/símbolos/pegar no-numérico, coma vs punto, vacío, valores fuera del rango permitido.
- Fechas: inválidas, año 0001/9999, muy futuras/pasadas, 31 en meses de 30, febrero/bisiesto, rangos que cruzan fin de año.
- Selects/menús: kebab cerca del borde (¿se corta/queda fuera?), selects largos (¿scrollean/tapan?), guardar sin elegir (¿validación?).

Modales y overlays (foco especial): ¿se ve completo o CORTADO?, contenido largo (¿crece/scrollea/rompe?), cerrar con X/Esc/backdrop (¿alguno cierra perdiendo datos sin avisar?), fondo bloqueado (no scrollea atrás), modal sobre modal (apilado/z-index/orden de cierre).

Flujos que rompen: doble/rápido submit (¿duplicados?), spam de clicks en acciones, guardar/navegar durante carga, borrar una entidad EN USO (borrado a cargo del usuario: ¿lo impide con mensaje?, ¿histórico consistente?), editar+cancelar (¿descarta y reabre con valores originales?). Borrar un elemento en uso desde el pool (¿bloqueado con mensaje, igual que un ejercicio en uso?); agregar un bloque del pool a una rutina y editarlo después dentro de esa rutina (¿el bloque original del pool queda intacto?); editar un bloque en el pool después de que ya fue usado en una rutina existente (¿la rutina ya armada no cambia?); completar un entrenamiento y después borrar o editar el ejercicio/bloque que usó (¿el historial preserva el snapshot sin cambios?); completar un entrenamiento y después renombrar o borrar un elemento que usaba (¿el historial sigue mostrando el equipo con el nombre viejo?); iniciar Modo entrenar y cortar la conexión a mitad del timer (¿sigue funcionando offline y sincroniza al volver la red?); tocar un tab de navegación con el timer corriendo (¿pide confirmación antes de salir?); cambiar el toggle de tema claro/oscuro en medio de Modo entrenar (¿no interrumpe ni reinicia el timer?).
<!-- Se mantiene al día: cada feature que introduce un flujo propio que puede romper lo suma acá. -->

Estados vacíos y carga pesada: usuario/listado sin registros (¿empty prolijo o NaN/undefined?), listado con 30+ registros (¿aguanta?, ¿números desbordan?).

Navegación: F5 en medio de un flujo (modal abierto, timer corriendo), botón atrás tras modales/cambio de contexto, URL interna pegada directo (¿carga o pantalla blanca?), backend caído (¿mensaje claro, no pantalla blanca?). No hay login ni sesión: la app es de un solo usuario sin auth.

Reporte: por hallazgo (1) dónde, (2) pasos, (3) qué pasó, (4) qué esperabas, (5) severidad (rompe/feo/menor), (6) screenshot. Agrupá por severidad; priorizá datos inválidos guardados, modales cortados/atrapantes, opciones inalcanzables, crashes.
---

## Plantilla del prompt per-feature

Guion per-feature que el orquestador sigue al cierre de cada tarea con superficie visual — lo ejecuta él directo contra el navegador, o lo entrega como prompt al usuario en el fallback. Estructura fija, en este orden, para que salga consistente:

1. **Rol + objetivo** — QA visual adversarial, con las mismas exclusiones (adaptación/rediseño mobile y a11y fuera) y el mismo chequeo permanente de los cuatro invariantes de contención responsive entre el ancho mínimo soportado (375px) y arriba (sin bajar de 375px), midiendo el régimen directo contra el viewport.
2. **Contexto breve de la feature** — qué hace, en términos de UI.
3. **Invariantes críticos** (testear primero) — p. ej. "cero-impacto con config vacía": la app se ve igual si la feature no está activada.
4. **Recorrido superficie por superficie** de lo que la feature toca — con qué mirar y qué esperar en cada una.
5. **Casos borde** de input y de estado propios de la feature.
6. **Modales/overlays nuevos** — cortado, cierre, apilado.
7. **Formato de reporte** (dónde / pasos / qué pasó / qué esperabas / severidad / screenshot). No hay paso de limpieza: la data de prueba de la base local no se revierte (ver arriba).

El contenido visual esperado (colores, posiciones, estados) sale del **"Checklist de aceptación visual"** del spec de `design` de esa feature; el orquestador lo reusa para los puntos 3 y 4.

## Cadencia

| Prompt | Cuándo |
|--------|--------|
| Per-feature | **Siempre**, en el paso 5.5 del flujo del orquestador, al cierre de cada tarea con superficie visual/UI. Lo ejecuta el orquestador directo contra `/chrome`; hand-off al usuario como fallback. |
| Genérico de regresión | **On-demand** y al cerrar una versión. |
