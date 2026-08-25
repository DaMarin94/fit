import { getThemeBootScript } from "@/lib/theme/boot-script";

/**
 * Server Component. Se renderiza en el `<head>` del layout raíz para que el
 * script de resolución de tema corra antes del primer paint (sin flash).
 */
export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getThemeBootScript() }}
    />
  );
}
