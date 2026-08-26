import { RoutinesService } from './routines.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { anyDate } from '../test-utils/matchers';

function createPrismaMock() {
  return {
    routine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    day: {
      deleteMany: jest.fn(),
    },
    exercise: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const validDto: CreateRoutineDto = {
  name: 'Plan semanal',
  days: [
    {
      blocks: [
        {
          name: 'Fuerza EMOM 12',
          type: 'fuerza',
          advanceMode: 'manual',
          timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
          exercises: [{ exerciseId: 'ex1', reps: 12 }],
        },
      ],
    },
  ],
};

describe('RoutinesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: RoutinesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    service = new RoutinesService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('lista rutinas activas con id, name y cantidad de días', async () => {
      prisma.routine.findMany.mockResolvedValue([
        { id: 'r1', name: 'Plan semanal', _count: { days: 5 } },
      ]);

      const result = await service.findAll();

      expect(prisma.routine.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result).toEqual([{ id: 'r1', name: 'Plan semanal', dayCount: 5 }]);
    });
  });

  describe('findOne', () => {
    it('devuelve el árbol completo de la rutina', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'r1', days: [] });

      const result = await service.findOne('r1');

      expect(result).toEqual({ id: 'r1', days: [] });
    });

    it('rechaza con NOT_FOUND si no existe o está borrada', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });
  });

  describe('create', () => {
    it('rechaza con NAME_TAKEN si ya existe una rutina activa con ese nombre', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(validDto)).rejects.toThrow(
        NameTakenException,
      );
      expect(prisma.routine.create).not.toHaveBeenCalled();
    });

    it('rechaza con EXERCISE_NOT_FOUND si algún exerciseId no existe o está borrado', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);
      prisma.exercise.findMany.mockResolvedValue([]);

      await expect(service.create(validDto)).rejects.toThrow(
        NotFoundWithCodeException,
      );
      expect(prisma.routine.create).not.toHaveBeenCalled();
    });

    it('crea la rutina con el árbol completo cuando todo es válido', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);
      prisma.exercise.findMany.mockResolvedValue([{ id: 'ex1' }]);
      prisma.routine.create.mockResolvedValue({ id: 'r1', ...validDto });

      const result = await service.create(validDto);

      const [createArgs] = prisma.routine.create.mock.calls[0] as [
        { data: unknown },
      ];
      expect(createArgs.data).toEqual({
        name: 'Plan semanal',
        days: {
          create: [
            {
              order: 0,
              blocks: {
                create: [
                  {
                    order: 0,
                    name: 'Fuerza EMOM 12',
                    type: 'fuerza',
                    advanceMode: 'manual',
                    timerConfig: {
                      totalDurationSeconds: 720,
                      taskIntervalSeconds: 60,
                    },
                    exercises: {
                      create: [
                        {
                          exerciseId: 'ex1',
                          order: 0,
                          reps: 12,
                          duration: undefined,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      });
      expect(result.id).toBe('r1');
    });
  });

  describe('update', () => {
    it('rechaza con NOT_FOUND si la rutina no existe', async () => {
      prisma.routine.findFirst.mockResolvedValueOnce(null);

      await expect(service.update('inexistente', validDto)).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });

    it('borra y recrea el árbol dentro de una transacción', async () => {
      prisma.routine.findFirst
        .mockResolvedValueOnce({ id: 'r1', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.exercise.findMany.mockResolvedValue([{ id: 'ex1' }]);
      prisma.day.deleteMany.mockResolvedValue({ count: 1 });
      prisma.routine.update.mockResolvedValue({ id: 'r1', ...validDto });

      const result = await service.update('r1', validDto);

      expect(prisma.day.deleteMany).toHaveBeenCalledWith({
        where: { routineId: 'r1' },
      });
      expect(prisma.routine.update).toHaveBeenCalled();
      expect(result.id).toBe('r1');
    });
  });

  describe('remove', () => {
    it('hace soft delete de la rutina', async () => {
      prisma.routine.findFirst.mockResolvedValue({ id: 'r1', deletedAt: null });
      prisma.routine.update.mockResolvedValue({
        id: 'r1',
        deletedAt: new Date(),
      });

      const result = await service.remove('r1');

      expect(prisma.routine.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { deletedAt: anyDate() },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('rechaza con NOT_FOUND si no existe', async () => {
      prisma.routine.findFirst.mockResolvedValue(null);

      await expect(service.remove('inexistente')).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });
  });
});
