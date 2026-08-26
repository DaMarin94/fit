import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExerciseInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

/**
 * CRUD de ejercicios del pool (RF-001). Nombre único entre ejercicios no
 * borrados (RN-005) y borrado bloqueado si está en uso (RN-007), en un
 * bloque del pool o en un bloque copiado de una rutina.
 */
@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.exercise.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateExerciseDto) {
    await this.ensureNameAvailable(dto.name);
    return this.prisma.exercise.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateExerciseDto) {
    await this.findActiveOrFail(id);
    await this.ensureNameAvailable(dto.name, id);
    return this.prisma.exercise.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    await this.findActiveOrFail(id);
    await this.ensureNotInUse(id);
    return this.prisma.exercise.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findActiveOrFail(id: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, deletedAt: null },
    });
    if (!exercise) {
      throw new NotFoundWithCodeException(
        'No se encontró el ejercicio.',
        'EXERCISE_NOT_FOUND',
      );
    }
    return exercise;
  }

  private async ensureNameAvailable(name: string, excludeId?: string) {
    const existing = await this.prisma.exercise.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new NameTakenException('Ya existe un ejercicio con ese nombre.');
    }
  }

  private async ensureNotInUse(id: string) {
    const inBlock = await this.prisma.blockExercise.findFirst({
      where: { exerciseId: id },
    });
    if (inBlock) {
      throw new ExerciseInUseException();
    }

    const inDayBlock = await this.prisma.dayBlockExercise.findFirst({
      where: { exerciseId: id },
    });
    if (inDayBlock) {
      throw new ExerciseInUseException();
    }
  }
}
