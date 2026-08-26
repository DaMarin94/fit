import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BlockType } from '@prisma/client';
import { BlockExerciseInputDto } from './block-exercise-input.dto';

/**
 * RN-006 + criterio del bloque de tipo `intervalos` (docs/backend.md,
 * decisión de la tarea): el shape de reps/duration de cada BlockExercise
 * depende del tipo de bloque.
 * - `cardio_libre`: cada fase lleva `duration` y no lleva `reps`.
 * - `intervalos`: el tiempo sale del `timerConfig`, sus ejercicios no
 *   llevan `reps` ni `duration` propios.
 * - `fuerza` / `metcon`: libres (reps y/o duration, si están presentes ya
 *   se validan positivos en BlockExerciseInputDto).
 */
@ValidatorConstraint({ name: 'ExercisesMatchBlockType', async: false })
export class ExercisesMatchBlockTypeConstraint implements ValidatorConstraintInterface {
  validate(exercises: unknown, args: ValidationArguments): boolean {
    const type = (args.object as { type?: BlockType }).type;
    if (!Array.isArray(exercises)) {
      return false;
    }

    return (exercises as BlockExerciseInputDto[]).every((exercise) => {
      const hasReps = exercise?.reps !== undefined && exercise?.reps !== null;
      const hasDuration =
        exercise?.duration !== undefined && exercise?.duration !== null;

      if (type === BlockType.cardio_libre) {
        return hasDuration && !hasReps;
      }
      if (type === BlockType.intervalos) {
        return !hasReps && !hasDuration;
      }
      return true;
    });
  }

  defaultMessage(args: ValidationArguments): string {
    const type = (args.object as { type?: BlockType }).type;
    if (type === BlockType.cardio_libre) {
      return 'Los ejercicios de un bloque cardio_libre necesitan duration y no reps.';
    }
    if (type === BlockType.intervalos) {
      return 'Los ejercicios de un bloque de intervalos no llevan reps ni duration propios.';
    }
    return 'Los ejercicios del bloque no son válidos.';
  }
}
