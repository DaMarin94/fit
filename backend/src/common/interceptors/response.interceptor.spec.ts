import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('envuelve el valor devuelto por el handler en { data }', (done) => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of({ id: '1', name: 'Sentadillas' }),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: { id: '1', name: 'Sentadillas' } });
      done();
    });
  });

  it('envuelve también valores primitivos y listas', (done) => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of([{ id: '1' }, { id: '2' }]),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: [{ id: '1' }, { id: '2' }] });
      done();
    });
  });
});
