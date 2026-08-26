import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * Ejercicio dentro de un bloque (pool o copiado a un día), en el body de
 * request. `order` NO se recibe: se infiere de la posición en el array
 * (decisión de la tarea, ver reporte al orquestador).
 */
export class BlockExerciseInputDto {
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  reps?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  duration?: number;
}
