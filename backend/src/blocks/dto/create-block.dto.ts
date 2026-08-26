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
import { BlockExerciseInputDto } from './block-exercise-input.dto';
import { IsValidTimerConfigConstraint } from './timer-config.validator';
import { ExercisesMatchBlockTypeConstraint } from './exercises-match-block-type.validator';

/**
 * RF-002/RF-003: creación (y edición, ver UpdateBlockDto) de un bloque del
 * pool. `exercises` es la lista completa y ordenada: el `order` de cada
 * BlockExercise se infiere de la posición en el array.
 */
export class CreateBlockDto {
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
