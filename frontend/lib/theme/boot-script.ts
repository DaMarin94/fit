import { THEME_STORAGE_KEY } from "./theme";

/**
 * Script bloqueante para inyectar en el `<head>`, antes del primer paint.
 * Resuelve el tema (guardado > sistema) y lo aplica como `data-theme` en
 * `<html>` antes de que React hidrate, para que nunca haya flash del modo
 * incorrecto (RN-011).
 *
 * Se entrega como string plano (no como módulo) porque corre fuera del
 * bundle de React, en un `<script>` inline server-rendered.
 */
export function getThemeBootScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY);
  return `(function(){try{var t;try{var s=localStorage.getItem(${key});if(s==="light"||s==="dark"){t=s;}}catch(e){}if(!t){t=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
}
