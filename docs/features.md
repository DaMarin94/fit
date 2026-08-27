# Features — Fit

Estado de implementación. Una línea por feature. El detalle funcional vive en `docs/requirements.md` (RF / RN) y en `docs/screens.md`.

| Feature | Requerimiento | Estado |
|---|---|---|
| Pool de elementos (crear, editar, listar, borrar) | RF-016 | Implementada |
| Grupos de equipo por ejercicio (requisitos fijos y alternativas) | RF-017, RN-014 | Implementada |
| Filtro del pool de ejercicios por elemento | RF-018 | Implementada |
| Bloqueo de borrado de un elemento en uso | RN-013 | Implementada |
| Pool de ejercicios (crear, editar, listar, borrar) | RF-001 | Implementada |
| Pool de bloques (crear, editar, listar, borrar) | RF-002, RF-003 | Implementada |
| Gestión de rutinas (crear, editar, listar, borrar) | RF-004 | Implementada |
| Estructura de días y bloques encadenados | RF-005 | Implementada |
| Agregar bloques a una rutina: copia del pool o ad-hoc | RF-006 | Implementada |
| Selector rápido sobre el pool | `screens.md` §6 | Implementada |
| Modo entrenar: ejecución de un día | RF-007 | Implementada |
| Timer EMOM | RF-008 | Implementada |
| Timer AMRAP | RF-008 | Implementada |
| Timer de intervalos work/rest | RF-008 | Implementada |
| Timer libre / cronómetro | RF-008 | Implementada |
| Aviso de transiciones del timer | RF-009 | Implementada |
| Pausar, reanudar y avanzar | RF-010 | Implementada |
| Avance entre bloques automático o manual | RF-011 | Implementada |
| Confirmación al salir con el timer corriendo | RN-010 | Implementada |
| Funcionamiento offline y sincronización | RN-004 | Implementada |
| Registro de historial al terminar (incluye el equipamiento congelado) | RF-012, RF-013, RN-015 | Implementada |
| Consulta de historial agrupada por semana y día | RF-014, RN-012 | Implementada |
| Toggle de tema claro/oscuro con persistencia | RF-015, RN-011 | Implementada |
| Semilla con el plan de ejemplo | `requirements.md` §6 | Implementada |

---

## Hallazgos abiertos

Desviaciones entre lo documentado y lo implementado, **sin decisión tomada**. Cada una se cierra eligiendo un lado: corregir el código para que cumpla la spec, o actualizar la spec para reflejar lo implementado. No se resuelven acá.

Ninguno.
