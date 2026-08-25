# Arquitectura — Fit

Stack y decisiones estructurales del sistema. Los estándares de código transversales están en `docs/technical.md`; los contratos, en `docs/data-model.md`.

---

## 1. Estructura del repositorio

Monorepo gestionado con **`pnpm`**:

```
/frontend    Next.js (App Router)
/backend     NestJS
/docs        documentación del proyecto
```

- Repositorio: `https://github.com/DaMarin94/fit.git`, rama principal **`main`**.
- Cada carpeta tiene su propio `.env` y su propio `.env.example` (`docs/technical.md` §6).
- **No hay paquete de tipos compartido.** El frontend define sus propios tipos como espejo del contrato de la API. La coordinación es por documentación (`docs/data-model.md`), no por código compartido.

---

## 2. Stack

| Capa | Tecnología | Puerto |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS + TypeScript strict | `3000` |
| Backend | NestJS + TypeScript strict | `3001` |
| Base de datos | PostgreSQL, accedida vía Prisma | `5432` |

---

## 3. Backend separado del frontend

El backend es una aplicación independiente, no una capa de API dentro de Next.js. Es lo que permite que el frontend sea un cliente más: el día que exista una app mobile nativa, consume el mismo backend sin mover lógica de dominio.

Consecuencia práctica: **la lógica de negocio vive en el backend**, no en el frontend. El frontend valida para dar feedback temprano, pero la validación autoritativa está del otro lado (`docs/technical.md` §3).

---

## 4. Sin autenticación

v1 es **single-user sin login**:

- No hay entidad de usuario, ni sesión, ni guard de auth, ni scoping por usuario.
- Ningún endpoint recibe ni infiere un usuario.
- El modelo de datos **no anticipa** multi-usuario (`docs/data-model.md` §1).

Multi-usuario es una versión futura y una decisión de arquitectura a tomar en su momento, con el dato que exista entonces. No se preparan campos ni capas "por las dudas".

---

## 5. Offline

**El comportamiento offline es del frontend.** Requisito en RN-004, estándar de implementación en `docs/technical.md` §8.

- El frontend cachea localmente (IndexedDB / service worker) lo necesario para que **Modo entrenar** funcione con la red caída: la rutina en ejecución y el estado del timer.
- El **timer corre íntegramente en el cliente**. No consulta al backend para contar, avanzar de fase ni avisar transiciones. Es la razón por la que el requisito es alcanzable: la ejecución no tiene dependencia de red en su camino crítico.
- Al recuperar la conexión, el frontend sincroniza los cambios pendientes contra el backend.
- El backend no participa: recibe la sincronización como escrituras normales, sin lógica especial.

---

## 6. Hosting

**Solo local.** No hay deploy a internet, ni entorno de staging, ni CI (RNF-002). Las tres piezas —frontend, backend y PostgreSQL— corren en la máquina del desarrollador.
