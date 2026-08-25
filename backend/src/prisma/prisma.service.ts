import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper de PrismaClient como provider de Nest. La conexión se establece
 * de forma perezosa (comportamiento default de Prisma, con la primera
 * query); acá solo se garantiza el cierre prolijo del pool de conexiones
 * cuando la aplicación se apaga.
 *
 * Nota: no se llama a `$connect()` en `onModuleInit` a propósito. Si se
 * conectara ahí, levantar la app (incluidos los tests e2e) fallaría cada vez
 * que no hay una Postgres real disponible, aunque ningún endpoint la use
 * todavía.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
