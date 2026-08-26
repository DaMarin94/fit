import { WorkoutLogsService } from './workout-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundWithCodeException } from '../common/exceptions/domain.exceptions';
import { anyDate } from '../test-utils/matchers';

interface WorkoutLogCreateArgs {
  data: { performedAt: Date; snapshot: unknown };
}

function createPrismaMock() {
  return {
    routine: {
      findFirst: jest.fn(),
    },
    day: {
      findFirst: jest.fn(),
    },
    workoutLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

const dayWithTree = {
  id: 'day1',
  routineId: 'r1',
  order: 0,
  blocks: [
    {
      order: 0,
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      advanceMode: 'manual',
      exercises: [
        {
          order: 0,
          reps: 12,
          duration: null,
          exercise: { name: 'goblet squats con kettlebell' },
        },
      ],
    },
  ],
};

describe('WorkoutLogsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: WorkoutLogsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new WorkoutLogsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rechaza con ROUTINE_NOT_FOUND si la rutina no existe o está borrada', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      await expect(service.create('r1', 'day1', {})).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });

    it('rechaza con DAY_NOT_FOUND si el día no pertenece a la rutina', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'r1', name: 'Plan' });
      prisma.day.findFirst.mockResolvedValue(null);

      await expect(service.create('r1', 'day1', {})).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });

    it('crea el WorkoutLog con el snapshot congelado del día', async () => {
      prisma.routine.findFirst.mockResolvedValue({
        id: 'r1',
        name: 'Plan semanal',
      });
      prisma.day.findFirst.mockResolvedValue(dayWithTree);
      prisma.workoutLog.create.mockImplementation(
        ({ data }: WorkoutLogCreateArgs) => ({
          id: 'log1',
          ...data,
        }),
      );

      const result = await service.create('r1', 'day1', {});

      expect(prisma.workoutLog.create).toHaveBeenCalledWith({
        data: {
          performedAt: anyDate(),
          snapshot: {
            routineName: 'Plan semanal',
            day: { order: 0 },
            blocks: [
              {
                name: 'Fuerza EMOM 12',
                type: 'fuerza',
                timerConfig: {
                  totalDurationSeconds: 720,
                  taskIntervalSeconds: 60,
                },
                advanceMode: 'manual',
                exercises: [
                  {
                    name: 'goblet squats con kettlebell',
                    order: 0,
                    reps: 12,
                    duration: null,
                  },
                ],
              },
            ],
          },
        },
      });
      expect(result.id).toBe('log1');
    });

    it('usa performedAt del body si se manda', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'r1', name: 'Plan' });
      prisma.day.findFirst.mockResolvedValue(dayWithTree);
      prisma.workoutLog.create.mockImplementation(
        ({ data }: WorkoutLogCreateArgs) => ({
          id: 'log1',
          ...data,
        }),
      );

      const result = await service.create('r1', 'day1', {
        performedAt: '2026-08-20T10:00:00.000Z',
      });

      expect(result.performedAt).toEqual(new Date('2026-08-20T10:00:00.000Z'));
    });
  });

  describe('findAll', () => {
    it('lista los registros ordenados por fecha descendente', async () => {
      prisma.workoutLog.findMany.mockResolvedValue([{ id: 'log1' }]);

      const result = await service.findAll();

      expect(prisma.workoutLog.findMany).toHaveBeenCalledWith({
        orderBy: { performedAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'log1' }]);
    });
  });
});
