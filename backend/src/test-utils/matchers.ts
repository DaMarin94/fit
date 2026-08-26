/**
 * `expect.any(Date)` tipado como `Date` en vez de `any`, para poder usarlo
 * dentro de argumentos de `toHaveBeenCalledWith` sin disparar
 * `@typescript-eslint/no-unsafe-assignment` (solo usado en tests).
 */
export function anyDate(): Date {
  return expect.any(Date) as Date;
}
