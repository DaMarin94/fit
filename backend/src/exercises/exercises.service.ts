import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExerciseInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

const EQUIPMENT_GROUPS_INCLUDE = {
  equipmentGroups: {
    orderBy: { id: 'asc' as const },
    include: { items: { orderBy: { id: 'asc' as const } } },
  },
};

type ExerciseWithGroups = {
  id: string;
  name: string;
  deletedAt: Date | null;
  equipmentGroups: { items: { equipmentId: string }[] }[];
};

/**
 * CRUD de ejercicios del pool (RF-001). Nombre único entre ejercicios no
 * borrados (RN-005) y borrado bloqueado si está en uso (RN-007), en un
 * bloque del pool o en un bloque copiado de una rutina.
 *
 * `equipmentGroups` (RF-017): cero o más grupos de equipo, cada uno con uno
 * o más `equipmentId` alternativos entre sí (RN-014, validado en el DTO).
 * Editar reemplaza por completo los grupos existentes: no hay "grupos"
 * identificables individualmente por el cliente (decisión de la tarea,
 * consistente con PATCH /blocks/:id).
 */
@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(equipmentId?: string) {
    const where =
      equipmentId === 'none'
        ? { deletedAt: null, equipmentGroups: { none: {} } }
        : equipmentId
          ? {
              deletedAt: null,
              equipmentGroups: {
                some: { items: { some: { equipmentId } } },
              },
            }
          : { deletedAt: null };

    const exercises = await this.prisma.exercise.findMany({
      where,
      include: EQUIPMENT_GROUPS_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return exercises.map((exercise) => this.toResponse(exercise));
  }

  async create(dto: CreateExerciseDto) {
    await this.ensureNameAvailable(dto.name);
    await this.ensureEquipmentExists(dto.equipmentGroups);

    const exercise = await this.prisma.exercise.create({
      data: {
        name: dto.name,
        equipmentGroups: {
          create: this.toEquipmentGroupsCreateInput(dto.equipmentGroups),
        },
      },
      include: EQUIPMENT_GROUPS_INCLUDE,
    });
    return this.toResponse(exercise);
  }

  async update(id: string, dto: UpdateExerciseDto) {
    await this.findActiveOrFail(id);
    await this.ensureNameAvailable(dto.name, id);
    await this.ensureEquipmentExists(dto.equipmentGroups);

    const exercise = await this.prisma.$transaction(async (tx) => {
      await tx.equipmentGroup.deleteMany({ where: { exerciseId: id } });
      return tx.exercise.update({
        where: { id },
        data: {
          name: dto.name,
          equipmentGroups: {
            create: this.toEquipmentGroupsCreateInput(dto.equipmentGroups),
          },
        },
        include: EQUIPMENT_GROUPS_INCLUDE,
      });
    });
    return this.toResponse(exercise);
  }

  async remove(id: string) {
    await this.findActiveOrFail(id);
    await this.ensureNotInUse(id);
    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: EQUIPMENT_GROUPS_INCLUDE,
    });
    return this.toResponse(exercise);
  }

  private toEquipmentGroupsCreateInput(equipmentGroups?: string[][]) {
    return (equipmentGroups ?? []).map((group) => ({
      items: { create: group.map((equipmentId) => ({ equipmentId })) },
    }));
  }

  private toResponse(exercise: ExerciseWithGroups) {
    return {
      id: exercise.id,
      name: exercise.name,
      equipmentGroups: exercise.equipmentGroups.map((group) =>
        group.items.map((item) => item.equipmentId),
      ),
      deletedAt: exercise.deletedAt,
    };
  }

  private async ensureEquipmentExists(equipmentGroups?: string[][]) {
    const equipmentIds = Array.from(new Set((equipmentGroups ?? []).flat()));
    if (equipmentIds.length === 0) {
      return;
    }

    const existing = await this.prisma.equipment.findMany({
      where: { id: { in: equipmentIds }, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((equipment) => equipment.id));
    const missing = equipmentIds.filter((id) => !existingIds.has(id));

    if (missing.length > 0) {
      throw new NotFoundWithCodeException(
        'Uno o más elementos de equipo no existen o fueron borrados.',
        'EQUIPMENT_NOT_FOUND',
      );
    }
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
