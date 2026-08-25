# Frontend — Fit

Arquitectura del frontend: estructura, componentes, design system portado y gotchas. Se completa a medida que hay código.

El stack está en `docs/architecture.md`; los estándares transversales en `docs/technical.md`; el lenguaje visual en `docs/design.md`.

---

## Estructura

Next.js 16 con App Router, TypeScript strict y Tailwind CSS v4. Sirve en el puerto `3000`.

Las tres tabs de `screens.md` §1 existen como rutas: `/` (Mis rutinas), `/pool` y `/historial`. Son stubs: la navegación funciona, el contenido de cada pantalla todavía no.

## Componentes

| Componente | Rol |
|---|---|
| `ThemeScript` | Script inline y bloqueante en el `<head>`: resuelve el modo de color antes de la hidratación, para que no haya destello (`design.md` §2.1, RN-011) |
| `NavBar` | **Las dos disposiciones existen a la vez en el DOM** y se muestran u ocultan por CSS con el prefijo `wide:`: tabs inferiores fijos en compacto, barra superior fija en amplio. Ninguna de las dos le resta ancho al contenido (`design.md` §8.3) |
| `ToastProvider` | Visor de toasts, montado en el layout raíz |

## Design system portado

Cómo los tokens y las escalas de `docs/design.md` se materializan en la configuración de Tailwind y en los estilos globales.

- **Color:** los tokens de `design.md` §3.4 y §3.5 (claro y oscuro, acento, semánticos y fases del timer) están volcados literalmente en `app/globals.css`, bajo los selectores `[data-theme="light"]` y `[data-theme="dark"]`.
- **Breakpoint:** el umbral único se declara como `@theme { --breakpoint-wide: 1024px }`, que es lo que habilita el prefijo `wide:` de Tailwind v4 (`design.md` §8.1).
- **Tipografías:** cargadas con `next/font/google`. Inter como `--font-sans` y JetBrains Mono como `--font-mono`, esta última para los numerales tabulares del timer (`design.md` §4.1, §4.2).

## Capa de datos

Wrapper de llamadas HTTP, manejo de errores y toasts. El estándar está en `docs/technical.md` §2; acá va la implementación concreta.

| Archivo | Rol |
|---|---|
| `lib/http/api-client.ts` | Único punto de salida de requests. Entiende las dos formas de éxito (`{ data }` o el recurso directo) y la forma de error (`{ error: { message, code } }`) de `data-model.md` §4.1. Ante cualquier error —incluido fallo de red— dispara el toast por su cuenta y relanza un `ApiError` con su `code`, para que el componente pueda hacer manejo específico |
| `lib/toast/toast-store.ts` | Store pub-sub sin dependencias de React; los componentes lo consumen con `useSyncExternalStore` |

Todavía no hay endpoints reales contra los cuales ejercitar esta capa: se prueba con `fetch` mockeado.

## Offline

Cache local y sincronización. El requisito está en RN-004 y la decisión estructural en `docs/architecture.md` §Offline.

_Sin contenido todavía._

## Motor del timer

_Sin contenido todavía._

## Testing

Vitest + React Testing Library, TDD estricto (`docs/technical.md` §Testing). Acá van las convenciones propias del frontend: helpers, mocks y qué se testea a qué nivel.

Cubiertos con tests escritos antes que la implementación: el tema y su boot script, el store de toasts, el cliente HTTP (con `fetch` mockeado) y el `NavBar` en sus dos disposiciones.

## Gotchas

- **Persistencia del tema:** atributo `data-theme` en `<html>` y clave `fit-theme` en `localStorage`. Es una decisión de implementación, no visual: `design.md` §2.1 fija el comportamiento (sigue al SO hasta que el usuario elige, RN-011) y no el mecanismo.
- **El toast no tiene spec visual propio** en `docs/design.md` (posición, animación de entrada y salida, iconografía). Se arma con tokens ya existentes —superficie, color semántico de error y éxito, radios, espaciado—, sin valores nuevos. Queda como spec pendiente de `design`, a producir cuando el toast tenga su primer caso de uso real contra endpoints (`roadmap.md` §Fase 1).
