# Adopción del kit

Checklist, en orden.

## 1. Copiar los archivos al proyecto

```
.claude/agents/orchestrator.md
.claude/agents/analyst.md
.claude/agents/design.md
.claude/agents/frontend.md
.claude/agents/backend.md
CLAUDE.md
docs/qa-visual.md
```

Si el proyecto ya tiene un `CLAUDE.md`, fusionalo: la "Regla de oro" y la sección "Agentes" son el aporte del kit.

Copiá además `KICKOFF.md` a la raíz del proyecto, **aparte**: es un doc de trabajo efímero para el paso 2. **No se commitea nunca y se borra al terminar** — ver el encabezado del propio archivo.

## 2. Correr el kickoff

Antes de llenar un solo `COMPLETAR` y antes de crear los docs, hay que **cerrar las definiciones**. Esa es la función de `KICKOFF.md`: un guion de entrevista de 8 bloques que el agente `analyst` conduce con el usuario, un bloque a la vez.

- Cubre producto, alcance v1, reglas de negocio, entidades, pantallas, stack, estándares transversales y lenguaje visual.
- Lo que no se puede responder se marca `PENDIENTE`, **no se inventa**. Un `PENDIENTE` que bloquea el desarrollo se escala antes de seguir.
- El bloque 6 (stack y estructura) define si aplican los **módulos opcionales** del paso 5.
- El bloque 8 junta materia prima visual; el agente `design` la convierte después en `docs/design.md`.

Los pasos 3 y 4 son **la descarga de este kickoff**: no se llenan de memoria ni improvisando. Cuando todo lo del kickoff vive en los docs reales, `KICKOFF.md` se borra.

## 3. Reemplazar `{{PROYECTO}}` y llenar los `COMPLETAR`

`{{PROYECTO}}` aparece en el frontmatter (`description`) y en la primera línea de los cinco agentes, y en el título de `CLAUDE.md`. Reemplazalo por el nombre real.

Después, todos los bloques `<!-- COMPLETAR: ... -->`, **con las respuestas del kickoff** (cada bloque declara a qué `COMPLETAR` alimenta):

| Archivo | COMPLETAR | Qué va |
|---------|-----------|--------|
| `CLAUDE.md` | 2 | Stack; decisiones de producto/arquitectura propias |
| `.claude/agents/orchestrator.md` | 1 | Stack del proyecto (o remitir a `CLAUDE.md`) |
| `.claude/agents/analyst.md` | 0 | — |
| `.claude/agents/design.md` | 2 | Reglas duras del design system; nombre del token de breakpoint |
| `.claude/agents/frontend.md` | 5 | Token de breakpoint; estándares de `technical.md`; framework de tests; stack; filas propias de la tabla "Dónde buscar" |
| `.claude/agents/backend.md` | 3 | Estándares de `technical.md`; stack; filas propias de la tabla "Dónde buscar" |
| `docs/qa-visual.md` | 3 | Valores responsive del proyecto; lista de superficies; flujos que rompen propios |

`docs/qa-visual.md` además usa placeholders inline que se reemplazan en todo el archivo: `{{ANCHO_MINIMO}}`, `{{BP_TOKEN}}`, `{{BP_RANGO}}`, `{{ANCHO_NAV}}`, `{{DESCRIPCION_APP}}`, `{{SUPERFICIES}}`, `{{FLUJOS_PROPIOS}}`.

Las tablas "Dónde buscar antes de tocar" de `frontend` y `backend` arrancan con las filas invariantes y **crecen con el proyecto**: cada área nueva suma su fila apuntando a la sección exacta de `docs/`.

## 4. Crear los docs que el flujo asume

El kit los referencia pero no los provee. Uno por archivo, en `docs/`. **Se llenan con las respuestas del kickoff** — son su destino final, no un ejercicio aparte:

| Doc | Qué va |
|-----|--------|
| `technical.md` | Estándares transversales: forma de las respuestas, manejo de errores, logging, validación, testing, migraciones, env, deploy. |
| `requirements.md` | Requerimientos funcionales, reglas de negocio y no funcionales (RF / RN / RNF). Destino canónico de toda regla funcional. |
| `data-model.md` | Entidades, shapes de request/response y contratos de API. Destino canónico de todo contrato. |
| `screens.md` | Definición funcional de cada pantalla: contenido, acciones, navegación, estados. |
| `architecture.md` | Stack y decisiones estructurales del sistema. |
| `features.md` | Estado de implementación, una línea por feature. |
| `frontend.md` | Arquitectura del frontend: estructura, componentes, design system portado, gotchas. |
| `backend.md` | Estructura y capas, endpoints, comportamiento por módulo, gotchas. |
| `design.md` | Guía viva del lenguaje visual, mantenida por `design`. Incluye la sección de contención responsive (umbral, disposiciones, cuatro invariantes). |
| `roadmap.md` | Doc de trabajo **descartable**: se borra al cerrar la versión. No es registro histórico. |

**Imprescindibles desde el día 1:** `technical.md`, `requirements.md`, `data-model.md`. Sin ellos, los agentes no tienen contra qué validar la "regla de oro".

**Crecen solos** a medida que el proyecto avanza: `features.md`, `frontend.md`, `backend.md`, `screens.md`, `architecture.md`. Alcanza con crearlos vacíos o con el esqueleto de secciones.

`design.md` lo arranca el agente `design` con la primera decisión visual, a partir de la materia prima del bloque 8 del kickoff; conviene sembrarlo con la sección de contención responsive antes de la primera feature de UI, porque el resto del kit la referencia.

Con todo esto volcado y sin `PENDIENTE` bloqueante, se tilda el criterio de salida de `KICKOFF.md` y **se borra el archivo**.

## 5. Módulos opcionales

Los dispara el bloque 6 del kickoff:

- **Sin UI** (CLI, API, servicio): se pueden omitir el agente `design`, el paso 5.5 del orquestador y `docs/qa-visual.md`. También caen las referencias a `design.md` en `frontend`/`CLAUDE.md`.
- **Sin partición frontend/backend** (monolito, app sola, librería): se ajustan esos dos agentes a la partición real del proyecto (o se colapsan en uno). El resto del flujo —planificar, delegar, documentar, git en dos aprobaciones— no cambia.
- **Sin `/chrome`**: el QA visual sigue existiendo con el modelo de fallback (hand-off del prompt al usuario).

## 6. Nombres de agente

El kit usa nombres a secas (`orchestrator`, `analyst`, …). Si vas a tener varios proyectos abiertos a la vez y querés distinguirlos, poneles prefijo (`miapp-orchestrator`, `miapp-analyst`, …) y actualizá las referencias cruzadas: el `name` del frontmatter, la sección "Agentes especialistas disponibles" del orquestador, la sección "Agentes" de `CLAUDE.md`, y las menciones a `design` / `frontend` / `backend` dentro de los cinco archivos y de `docs/qa-visual.md`.
