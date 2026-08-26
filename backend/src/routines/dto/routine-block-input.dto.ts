import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { AdvanceMode, BlockType } from '@prisma/client';
import { BlockExerciseInputDto } from '../../blocks/dto/block-exercise-input.dto';
import { IsValidTimerConfigConstraint } from '../../blocks/dto/timer-config.validator';
import { ExercisesMatchBlockTypeConstraint } from '../../blocks/dto/exercises-match-block-type.validator';

/**
 * Bloque COPIADO dentro de un día de rutina (data-model.md §2.8, RN-002,
 * RN-003). El frontend arma el árbol completo del lado cliente —copiando un
 * bloque del pool o creando uno ad-hoc, indistinguibles acá— y lo manda
 * entero al guardar la rutina. `order` NO se recibe: se infiere de la
 * posición del bloque dentro de la lista del día.
 */
export class RoutineBlockInputDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(BlockType)
  type!: BlockType;

  @IsEnum(AdvanceMode)
  advanceMode!: AdvanceMode;

  @IsObject()
  @Validate(IsValidTimerConfigConstraint)
  timerConfig!: Record<string, number>;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlockExerciseInputDto)
  @Validate(ExercisesMatchBlockTypeConstraint)
  exercises!: BlockExerciseInputDto[];
}
