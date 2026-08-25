import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { LoggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('llama a next() sin esperar a que termine la respuesta', () => {
    const next: NextFunction = jest.fn();
    const req = { method: 'GET', originalUrl: '/ejercicios' } as Request;
    const res = { on: jest.fn(), statusCode: 200 } as unknown as Response;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('loguea método, ruta y status cuando la respuesta termina', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const next: NextFunction = jest.fn();
    const req = { method: 'POST', originalUrl: '/rutinas' } as Request;
    let finishCallback: () => void = () => undefined;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      },
      statusCode: 201,
    } as unknown as Response;

    middleware.use(req, res, next);
    finishCallback();

    expect(logSpy).toHaveBeenCalledWith('POST /rutinas 201');
  });

  it('nunca loguea el body del request', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const next: NextFunction = jest.fn();
    const req = {
      method: 'POST',
      originalUrl: '/rutinas',
      body: { name: 'secreto' },
    } as Request;
    let finishCallback: () => void = () => undefined;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      },
      statusCode: 201,
    } as unknown as Response;

    middleware.use(req, res, next);
    finishCallback();

    const loggedArgs = logSpy.mock.calls.flat();
    expect(
      loggedArgs.some((arg) => JSON.stringify(arg).includes('secreto')),
    ).toBe(false);
  });
});
