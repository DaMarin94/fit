import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BlockType } from '@prisma/client';

/**
 * Shape de `timerConfig` según el `type` del bloque (data-model.md §2.5).
 * Todos los números son enteros positivos (RN-006). `cardio_libre` no lleva
 * campos propios: su estructura de fases es la lista de `BlockExercise`.
 */
function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

const REQUIRED_KEYS_BY_TYPE: Record<BlockType, string[]> = {
  fuerza: ['totalDurationSeconds', 'taskIntervalSeconds'],
  metcon: ['totalDurationSeconds'],
  intervalos: ['workSeconds', 'restSeconds', 'rounds'],
  cardio_libre: [],
};

@ValidatorConstraint({ name: 'IsValidTimerConfig', async: false })
export class IsValidTimerConfigConstraint implements ValidatorConstraintInterface {
  validate(timerConfig: unknown, args: ValidationArguments): boolean {
    const type = (args.object as { type?: BlockType }).type;
    if (!type || !(type in REQUIRED_KEYS_BY_TYPE)) {
      // El tipo en sí es inválido; lo reporta el @IsEnum del campo `type`.
      return true;
    }

    if (
      typeof timerConfig !== 'object' ||
      timerConfig === null ||
      Array.isArray(timerConfig)
    ) {
      return false;
    }

    const requiredKeys = REQUIRED_KEYS_BY_TYPE[type];
    const actualKeys = Object.keys(timerConfig);

    if (actualKeys.length !== requiredKeys.length) {
      return false;
    }
    if (!requiredKeys.every((key) => actualKeys.includes(key))) {
      return false;
    }

    return requiredKeys.every((key) =>
      isPositiveInt((timerConfig as Record<string, unknown>)[key]),
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const type = (args.object as { type?: BlockType }).type;
    const requiredKeys = type ? REQUIRED_KEYS_BY_TYPE[type] : undefined;
    if (requiredKeys && requiredKeys.length > 0) {
      return `timerConfig debe tener exactamente estos campos, todos enteros positivos: ${requiredKeys.join(', ')}.`;
    }
    return 'timerConfig no es válido para el tipo de bloque cardio_libre: no lleva campos propios.';
  }
}
