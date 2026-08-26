import { IsISO8601, IsOptional } from 'class-validator';

/**
 * RF-012/RF-013: terminar un entrenamiento. `performedAt` es opcional; si no
 * se manda, se usa el momento actual del servidor.
 */
export class CreateWorkoutLogDto {
  @IsOptional()
  @IsISO8601()
  performedAt?: string;
}
