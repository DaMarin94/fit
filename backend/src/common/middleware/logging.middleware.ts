import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Loguea método, ruta y status de cada request (technical.md §4). Nunca
 * loguea el body ni credenciales: solo lee `method`, `originalUrl` y
 * `statusCode`.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    res.on('finish', () => {
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    });

    next();
  }
}
