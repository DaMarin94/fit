# Agent Kit

Estructura de agentes y lógica de trabajo para proyectos manejados con Claude Code. Es el workflow tal como corre en producción en un proyecto real, extraído y parametrizado: cinco roles con scope estricto, un flujo de 11 pasos, y reglas de documentación que evitan que la doc se convierta en un changelog.

El kit trae los agentes, el `CLAUDE.md` y el guion de QA visual. **No trae los docs del proyecto** (`requirements.md`, `data-model.md`, etc.): esos los crea cada proyecto — ver `SETUP.md`.

Trae además `KICKOFF.md`: un guion de entrevista efímero que el `analyst` conduce para cerrar las definiciones antes de escribir código, y que se borra —sin commitearse— cuando su contenido ya vive en los docs reales.

## Los cinco roles

| Agente | Qué hace |
|--------|----------|
| `orchestrator` | Lee, analiza impacto, propone el plan, delega, coordina contratos y specs, y es el **único** que hace git. No escribe código. |
| `analyst` | Análisis funcional, requerimientos, pantallas. Único escriba de la documentación funcional y técnica. No escribe código. |
| `design` | Criterio UX/UI: audita (modo evaluación) y produce el spec visual que `frontend` implementa (modo spec). Único escriba de `docs/design.md`. |
| `frontend` | Implementa el frontend siguiendo el spec de `design`. No toca el backend, no hace git. |
| `backend` | Implementa el backend. No toca el frontend, no hace git. |

## El flujo

1. Leer el código relevante (quirúrgico, no exhaustivo).
2. Analizar el impacto.
3. Proponer el plan y **esperar aprobación** antes de delegar.
4. Delegar la implementación (con los pasos 4.5 contrato backend→frontend y 4.6 spec design→frontend).
5. Verificar builds; y 5.5, QA visual per-feature para toda tarea con UI.
6. Decidir qué se documenta y dónde; delegar la escritura al analista.
7. `git status` + `git diff`.
8. Proponer el commit y **esperar aprobación**.
9. Commitear.
10. Proponer el push y **esperar aprobación separada**.
11. Pushear.

## Las invariantes que lo hacen funcionar

- **Un solo agente hace git.** Solo el orquestador commitea y pushea.
- **Commit y push son aprobaciones separadas.** Siempre, sin excepciones.
- **Los especialistas no escriben documentación.** Reportan señales (contratos, reglas, gotchas); el orquestador cura y decide.
- **El analista es el único escriba funcional/técnico.** Un solo spawn por feature, con toda la doc junta.
- **`design` es el único escriba visual.** `docs/design.md` es su documento.
- **design → frontend por spec.** Color, tipografía, tamaño, ubicación y jerarquía las decide `design`; el frontend no improvisa valores visuales.
- **backend → frontend por contrato.** Todo cambio de shape de endpoint se notifica antes de que el frontend lo consuma.
- **La documentación va en el mismo commit que el código.** Nunca después.
- **La doc es una foto del estado actual, en presente.** El historial es trabajo de git.

## Cómo se adopta

Ver `SETUP.md`.
