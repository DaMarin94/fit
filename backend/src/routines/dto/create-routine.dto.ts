import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RoutineDayInputDto } from './routine-day-input.dto';

/**
 * RF-004/RF-005/RF-006: creación (y reemplazo completo en edición, ver
 * UpdateRoutineDto) de una rutina con su árbol completo de días y bloques
 * copiados.
 */
export class CreateRoutineDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoutineDayInputDto)
  days!: RoutineDayInputDto[];
}
