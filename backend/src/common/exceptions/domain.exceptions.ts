import { ConflictException, NotFoundException } from '@nestjs/common';

/**
 * Excepciones de dominio compartidas entre los módulos de Fase 1
 * (ejercicios, bloques, rutinas). Declaran su propio `code`, que
 * `AllExceptionsFilter` respeta tal cual (docs/backend.md §Gotchas).
 */

/** RN-005: nombre único dentro del espacio de nombres de la entidad. */
export class NameTakenException extends ConflictException {
  constructor(message: string) {
    super({ message, code: 'NAME_TAKEN' });
  }
}

/** RN-007: no se borra un ejercicio referenciado por algún bloque. */
export class ExerciseInUseException extends ConflictException {
  constructor() {
    super({
      message:
        'No se puede borrar: el ejercicio está en uso en uno o más bloques. Sacalo del bloque primero.',
      code: 'EXERCISE_IN_USE',
    });
  }
}

/** RN-013: no se borra un elemento referenciado por algún grupo de equipo
 * de algún ejercicio. Mismo criterio que ExerciseInUseException (RN-007). */
export class EquipmentInUseException extends ConflictException {
  constructor() {
    super({
      message:
        'No se puede borrar: el elemento está en uso en uno o más ejercicios. Sacalo del ejercicio primero.',
      code: 'EQUIPMENT_IN_USE',
    });
  }
}

/** 404 genérico con `code` explícito, para no repetir la forma en cada
 * módulo (ej. EXERCISE_NOT_FOUND, BLOCK_NOT_FOUND, ROUTINE_NOT_FOUND). */
export class NotFoundWithCodeException extends NotFoundException {
  constructor(message: string, code: string) {
    super({ message, code });
  }
}
