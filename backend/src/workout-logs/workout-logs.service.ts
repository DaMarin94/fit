import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundWithCodeException } from '../common/exceptions/domain.exceptions';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';

/**
 * RF-012/RF-013, RN-001: terminar un entrenamiento crea un WorkoutLog con la
 * estructura completa del día ejecutado congelada. Sin edición ni borrado.
 */
@Injectable()
export class WorkoutLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(routineId: string, dayId: string, dto: CreateWorkoutLogDto) {
    const routine = await this.prisma.routine.findFirst({
      where: { id: routineId, deletedAt: null },
    });
    if (!routine) {
      throw new NotFoundWithCodeException(
        'No se encontró la rutina.',
        'ROUTINE_NOT_FOUND',
      );
    }

    const day = await this.prisma.day.findFirst({
      where: { id: dayId, routineId },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: {
                exercise: {
                  include: {
                    equipmentGroups: {
                      orderBy: { id: 'asc' },
                      include: {
                        items: {
                          orderBy: { id: 'asc' },
                          include: { equipment: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!day) {
      throw new NotFoundWithCodeException(
        'No se encontró el día dentro de esa rutina.',
        'DAY_NOT_FOUND',
      );
    }

    const performedAt = dto.performedAt
      ? new Date(dto.performedAt)
      : new Date();

    const snapshot = {
      routineName: routine.name,
      day: { order: day.order },
      blocks: day.blocks.map((block) => ({
        name: block.name,
        type: block.type,
        timerConfig: block.timerConfig,
        advanceMode: block.advanceMode,
        exercises: block.exercises.map((exercise) => ({
          name: exercise.exercise.name,
          order: exercise.order,
          reps: exercise.reps,
          duration: exercise.duration,
          // RN-015: congela los grupos de equipo con los nombres de los
          // elementos por valor, no por referencia a Equipment.
          equipmentGroups: exercise.exercise.equipmentGroups.map((group) =>
            group.items.map((item) => item.equipment.name),
          ),
        })),
      })),
    };

    return this.prisma.workoutLog.create({
      data: { performedAt, snapshot },
    });
  }

  findAll() {
    return this.prisma.workoutLog.findMany({
      orderBy: { performedAt: 'desc' },
    });
  }
}
