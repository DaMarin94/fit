import { HttpStatus } from '@nestjs/common';
import {
  ExerciseInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from './domain.exceptions';

describe('Excepciones de dominio', () => {
  it('NameTakenException responde 409 con code NAME_TAKEN', () => {
    const exception = new NameTakenException(
      'Ya existe un ejercicio con ese nombre.',
    );

    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.getResponse()).toEqual({
      message: 'Ya existe un ejercicio con ese nombre.',
      code: 'NAME_TAKEN',
    });
  });

  it('ExerciseInUseException responde 409 con code EXERCISE_IN_USE', () => {
    const exception = new ExerciseInUseException();

    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    const body = exception.getResponse() as { message: string; code: string };
    expect(body.code).toBe('EXERCISE_IN_USE');
    expect(body.message).toContain('bloque');
  });

  it('NotFoundWithCodeException responde 404 con el code recibido', () => {
    const exception = new NotFoundWithCodeException(
      'No se encontró el ejercicio.',
      'EXERCISE_NOT_FOUND',
    );

    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.getResponse()).toEqual({
      message: 'No se encontró el ejercicio.',
      code: 'EXERCISE_NOT_FOUND',
    });
  });
});
