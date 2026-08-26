import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { RoutineBlockInputDto } from './routine-block-input.dto';

/**
 * Día de una rutina (data-model.md §2.8): uno o más bloques copiados,
 * encadenados en orden (RF-005). `order` NO se recibe: se infiere de la
 * posición del día dentro de `days`.
 */
export class RoutineDayInputDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoutineBlockInputDto)
  blocks!: RoutineBlockInputDto[];
}
