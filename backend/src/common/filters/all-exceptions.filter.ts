import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Forma de respuesta de error única para toda la API (data-model.md §4.1). */
interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
  };
}

/** Código estable por defecto según el status HTTP, para excepciones que no
 * declaran un `code` propio (ej. las de Nest como NotFoundException). */
const DEFAULT_CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

const GENERIC_ERROR_MESSAGE =
  'Ocurrió un error inesperado. Intentá de nuevo en unos minutos.';

/**
 * Único productor de respuestas de error de la API. Traduce cualquier
 * excepción —de Nest, de class-validator o no controlada— a la forma
 * `{ error: { message, code } }` (docs/data-model.md §4.1).
 *
 * Las excepciones de dominio (Fase 1 en adelante) declaran su propio `code`
 * pasando `{ message, code }` como response de un HttpException; este filtro
 * lo respeta tal cual. Para el resto, deriva un código estable a partir del
 * status HTTP.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsHandler');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message } = this.resolve(exception);

    const isServerError = status >= 500;
    if (isServerError) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${request.method} ${request.url} ${status}`, stack);
    }

    const body: ErrorResponseBody = { error: { message, code } };
    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;

        if (typeof body.code === 'string') {
          const message =
            typeof body.message === 'string' ? body.message : exception.message;
          return { status, code: body.code, message };
        }

        if (Array.isArray(body.message)) {
          return {
            status,
            code: 'VALIDATION_ERROR',
            message: body.message.join('. '),
          };
        }

        if (typeof body.message === 'string') {
          return {
            status,
            code: DEFAULT_CODE_BY_STATUS[status] ?? 'ERROR',
            message: body.message,
          };
        }
      }

      return {
        status,
        code: DEFAULT_CODE_BY_STATUS[status] ?? 'ERROR',
        message: exception.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}
