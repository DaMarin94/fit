import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockExerciseInputDto } from './dto/block-exercise-input.dto';

/**
 * CRUD de bloques del pool (RF-002, RF-003). Nombre único entre bloques no
 * borrados (RN-005). Sin bloqueo de borrado: las rutinas que ya usan un
 * bloque tienen su propia copia y no se ven afectadas (RN-002).
 */
@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.block.findMany({
      where: { deletedAt: null },
      include: { exercises: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateBlockDto) {
    await this.ensureNameAvailable(dto.name);
    return this.prisma.block.create({
      data: {
        name: dto.name,
        type: dto.type,
        advanceMode: dto.advanceMode,
        timerConfig: dto.timerConfig,
        exercises: { create: this.toExerciseCreateInput(dto.exercises) },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateBlockDto) {
    await this.findActiveOrFail(id);
    await this.ensureNameAvailable(dto.name, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.blockExercise.deleteMany({ where: { blockId: id } });
      return tx.block.update({
        where: { id },
        data: {
          name: dto.name,
          type: dto.type,
          advanceMode: dto.advanceMode,
          timerConfig: dto.timerConfig,
          exercises: { create: this.toExerciseCreateInput(dto.exercises) },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async remove(id: string) {
    await this.findActiveOrFail(id);
    return this.prisma.block.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toExerciseCreateInput(exercises: BlockExerciseInputDto[]) {
    return exercises.map((exercise, order) => ({
      exerciseId: exercise.exerciseId,
      order,
      reps: exercise.reps,
      duration: exercise.duration,
    }));
  }

  private async findActiveOrFail(id: string) {
    const block = await this.prisma.block.findFirst({
      where: { id, deletedAt: null },
    });
    if (!block) {
      throw new NotFoundWithCodeException(
        'No se encontró el bloque.',
        'BLOCK_NOT_FOUND',
      );
    }
    return block;
  }

  private async ensureNameAvailable(name: string, excludeId?: string) {
    const existing = await this.prisma.block.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new NameTakenException('Ya existe un bloque con ese nombre.');
    }
  }
}
