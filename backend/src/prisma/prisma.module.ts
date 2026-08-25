import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global para que cualquier módulo de dominio pueda inyectar PrismaService
 * sin tener que reimportar este módulo cada vez (patrón estándar de Nest
 * para el cliente de base de datos).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
