import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** Excepción de dominio de ejemplo, con `code` explícito, como las que se
 * agregarán en Fase 1 (ej. NAME_TAKEN, IN_USE). */
class DomainException extends HttpException {
  constructor(message: string, code: string, status: HttpStatus) {
    super({ message, code }, status);
  }
}

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = {
    method: 'GET',
    url: '/ejercicios',
    originalUrl: '/ejercicios',
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('respeta el código explícito de una excepción de dominio', () => {
    const { host, status, json } = createHost();
    const exception = new DomainException(
      'Ya existe un ejercicio con ese nombre.',
      'NAME_TAKEN',
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      error: {
        message: 'Ya existe un ejercicio con ese nombre.',
        code: 'NAME_TAKEN',
      },
    });
  });

  it('deriva un código por defecto a partir del status para HttpException sin code', () => {
    const { host, status, json } = createHost();
    const exception = new NotFoundException('No se encontró el ejercicio.');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      error: {
        message: 'No se encontró el ejercicio.',
        code: 'NOT_FOUND',
      },
    });
  });

  it('junta los mensajes de validación de class-validator en un solo mensaje', () => {
    const { host, status, json } = createHost();
    const exception = new BadRequestException([
      'name should not be empty',
      'reps must be a positive number',
    ]);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      error: {
        message: 'name should not be empty. reps must be a positive number',
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('traduce cualquier error no controlado a un 500 genérico, sin exponer el mensaje interno', () => {
    const { host, status, json } = createHost();
    const exception = new Error('conexión a la base de datos perdida');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [payload] = json.mock.calls[0] as [
      { error: { message: string; code: string } },
    ];
    expect(payload.error.code).toBe('INTERNAL_ERROR');
    expect(payload.error.message).not.toContain(
      'conexión a la base de datos perdida',
    );
  });

  it('loguea el stack trace de los errores no controlados', () => {
    const { host } = createHost();
    const errorSpy = jest.spyOn(Logger.prototype, 'error');
    const exception = new Error('boom');

    filter.catch(exception, host);

    expect(errorSpy).toHaveBeenCalled();
    const [, stack] = errorSpy.mock.calls[0] as [string, string | undefined];
    expect(stack).toBe(exception.stack);
  });
});
