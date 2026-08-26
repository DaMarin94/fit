import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { RoutineDayInputDto } from './dto/routine-day-input.dto';

const FULL_TREE_INCLUDE = {
  days: {
    orderBy: { order: 'asc' as const },
    include: {
      blocks: {
        orderBy: { order: 'asc' as const },
        include: {
          exercises: { orderBy: { order: 'asc' as const } },
        },
      },
    },
  },
};

/**
 * CRUD de rutinas (RF-004, RF-005, RF-006). No hay endpoint separado para
 * agregar un bloque del pool vs. uno ad-hoc: el frontend arma el árbol
 * completo (rutina → días → bloques copiados → ejercicios) y lo manda
 * entero. `order` de días/bloques/ejercicios se infiere de la posición en
 * los arrays del body (decisión de la tarea).
 */
@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const routines = await this.prisma.routine.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { days: true } } },
      orderBy: { name: 'asc' },
    });

    return routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      dayCount: routine._count.days,
    }));
  }

  async findOne(id: string) {
    return this.findActiveOrFail(id);
  }

  async create(dto: CreateRoutineDto) {
    await this.ensureNameAvailable(dto.name);
    await this.ensureExercisesExist(dto.days);

    return this.prisma.routine.create({
      data: {
        name: dto.name,
        days: { create: this.toDaysCreateInput(dto.days) },
      },
      include: FULL_TREE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateRoutineDto) {
    await this.findActiveOrFail(id);
    await this.ensureNameAvailable(dto.name, id);
    await this.ensureExercisesExist(dto.days);

    return this.prisma.$transaction(async (tx) => {
      await tx.day.deleteMany({ where: { routineId: id } });
      return tx.routine.update({
        where: { id },
        data: {
          name: dto.name,
          days: { create: this.toDaysCreateInput(dto.days) },
        },
        include: FULL_TREE_INCLUDE,
      });
    });
  }

  async remove(id: string) {
    await this.findActiveOrFail(id);
    return this.prisma.routine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDaysCreateInput(days: RoutineDayInputDto[]) {
    return days.map((day, dayOrder) => ({
      order: dayOrder,
      blocks: {
        create: day.blocks.map((block, blockOrder) => ({
          order: blockOrder,
          name: block.name,
          type: block.type,
          advanceMode: block.advanceMode,
          timerConfig: block.timerConfig,
          exercises: {
            create: block.exercises.map((exercise, exerciseOrder) => ({
              exerciseId: exercise.exerciseId,
              order: exerciseOrder,
              reps: exercise.reps,
              duration: exercise.duration,
            })),
          },
        })),
      },
    }));
  }

  private async ensureExercisesExist(days: RoutineDayInputDto[]) {
    const exerciseIds = Array.from(
      new Set(
        days.flatMap((day) =>
          day.blocks.flatMap((block) =>
            block.exercises.map((exercise) => exercise.exerciseId),
          ),
        ),
      ),
    );

    if (exerciseIds.length === 0) {
      return;
    }

    const existing = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((exercise) => exercise.id));
    const missing = exerciseIds.filter((id) => !existingIds.has(id));

    if (missing.length > 0) {
      throw new NotFoundWithCodeException(
        'Uno o más ejercicios de la rutina no existen o fueron borrados.',
        'EXERCISE_NOT_FOUND',
      );
    }
  }

  private async findActiveOrFail(id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, deletedAt: null },
      include: FULL_TREE_INCLUDE,
    });
    if (!routine) {
      throw new NotFoundWithCodeException(
        'No se encontró la rutina.',
        'ROUTINE_NOT_FOUND',
      );
    }
    return routine;
  }

  private async ensureNameAvailable(name: string, excludeId?: string) {
    const existing = await this.prisma.routine.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new NameTakenException('Ya existe una rutina con ese nombre.');
    }
  }
}
