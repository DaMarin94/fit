import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Envoltorio de respuesta exitosa de la API (data-model.md §4.1). */
export interface SuccessResponseBody<T> {
  data: T;
}

/**
 * Envuelve toda respuesta exitosa de la API en `{ data }`. Es la contraparte
 * de AllExceptionsFilter, que hace lo propio con los errores.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseBody<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponseBody<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
