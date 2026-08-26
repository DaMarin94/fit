import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';
import { anyDate } from '../test-utils/matchers';
import {
  ExerciseInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';

function createPrismaMock() {
  return {
    exercise: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    equipment: {
      findMany: jest.fn(),
    },
    equipmentGroup: {
      deleteMany: jest.fn(),
    },
    blockExercise: {
      findFirst: jest.fn(),
    },
    dayBlockExercise: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const noGroupsRecord = {
  id: '1',
  name: 'push ups',
  deletedAt: null,
  equipmentGroups: [],
};

const remosRecord = {
  id: '2',
  name: 'remos',
  deletedAt: null,
  equipmentGroups: [
    {
      id: 'g1',
      exerciseId: '2',
      items: [
        { id: 'i1', equipmentGroupId: 'g1', equipmentId: 'kb1' },
        { id: 'i2', equipmentGroupId: 'g1', equipmentId: 'mc1' },
      ],
    },
  ],
};

describe('ExercisesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ExercisesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    service = new ExercisesService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('lista los ejercicios no borrados con sus equipmentGroups aplanados a equipmentId', async () => {
      prisma.exercise.findMany.mockResolvedValue([remosRecord]);

      const result = await service.findAll();

      expect(prisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result).toEqual([
        {
          id: '2',
          name: 'remos',
          equipmentGroups: [['kb1', 'mc1']],
          deletedAt: null,
        },
      ]);
    });

    it('filtra por equipmentId: ejercicios que lo listan en algún grupo (RF-018)', async () => {
      prisma.exercise.findMany.mockResolvedValue([remosRecord]);

      await service.findAll('kb1');

      expect(prisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            equipmentGroups: { some: { items: { some: { equipmentId: 'kb1' } } } },
          },
        }),
      );
    });

    it('filtra por "none": ejercicios sin ningún grupo de equipo (RF-018)', async () => {
      prisma.exercise.findMany.mockResolvedValue([noGroupsRecord]);

      await service.findAll('none');

      expect(prisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            equipmentGroups: { none: {} },
          },
        }),
      );
    });
  });

  describe('create', () => {
    it('crea el ejercicio sin equipmentGroups cuando no se mandan (peso corporal)', async () => {
      prisma.exercise.findFirst.mockResolvedValue(null);
      prisma.exercise.create.mockResolvedValue(noGroupsRecord);

      const result = await service.create({ name: 'push ups' });

      expect(prisma.exercise.create).toHaveBeenCalledWith({
        data: { name: 'push ups', equipmentGroups: { create: [] } },
        include: expect.anything(),
      });
      expect(result.equipmentGroups).toEqual([]);
    });

    it('crea el ejercicio con sus grupos de equipo', async () => {
      prisma.exercise.findFirst.mockResolvedValue(null);
      prisma.equipment.findMany.mockResolvedValue([
        { id: 'kb1' },
        { id: 'mc1' },
      ]);
      prisma.exercise.create.mockResolvedValue(remosRecord);

      const result = await service.create({
        name: 'remos',
        equipmentGroups: [['kb1', 'mc1']],
      });

      expect(prisma.exercise.create).toHaveBeenCalledWith({
        data: {
          name: 'remos',
          equipmentGroups: {
            create: [
              { items: { create: [{ equipmentId: 'kb1' }, { equipmentId: 'mc1' }] } },
            ],
          },
        },
        include: expect.anything(),
      });
      expect(result.equipmentGroups).toEqual([['kb1', 'mc1']]);
    });

    it('rechaza con EQUIPMENT_NOT_FOUND si algún equipmentId no existe o está borrado', async () => {
      prisma.exercise.findFirst.mockResolvedValue(null);
      prisma.equipment.findMany.mockResolvedValue([]);

      await expect(
        service.create({ name: 'remos', equipmentGroups: [['kb1']] }),
      ).rejects.toThrow(NotFoundWithCodeException);
      expect(prisma.exercise.create).not.toHaveBeenCalled();
    });

    it('rechaza con NAME_TAKEN si ya existe un ejercicio activo con ese nombre', async () => {
      prisma.exercise.findFirst.mockResolvedValue({
        id: '1',
        name: 'push ups',
        deletedAt: null,
      });

      await expect(service.create({ name: 'push ups' })).rejects.toThrow(
        NameTakenException,
      );
      expect(prisma.exercise.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('reemplaza por completo los equipmentGroups existentes', async () => {
      prisma.exercise.findFirst
        .mockResolvedValueOnce({ id: '2', name: 'remos', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.equipment.findMany.mockResolvedValue([{ id: 'kb1' }]);
      prisma.exercise.update.mockResolvedValue({
        id: '2',
        name: 'remos',
        deletedAt: null,
        equipmentGroups: [
          {
            id: 'g2',
            exerciseId: '2',
            items: [{ id: 'i3', equipmentGroupId: 'g2', equipmentId: 'kb1' }],
          },
        ],
      });

      const result = await service.update('2', {
        name: 'remos',
        equipmentGroups: [['kb1']],
      });

      expect(prisma.equipmentGroup.deleteMany).toHaveBeenCalledWith({
        where: { exerciseId: '2' },
      });
      expect(prisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: {
          name: 'remos',
          equipmentGroups: {
            create: [{ items: { create: [{ equipmentId: 'kb1' }] } }],
          },
        },
        include: expect.anything(),
      });
      expect(result.equipmentGroups).toEqual([['kb1']]);
    });

    it('permite reemplazar a cero grupos (RN-014: sin equipo)', async () => {
      prisma.exercise.findFirst
        .mockResolvedValueOnce({ id: '2', name: 'remos', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.exercise.update.mockResolvedValue(noGroupsRecord);

      const result = await service.update('2', { name: 'push ups' });

      expect(prisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: { name: 'push ups', equipmentGroups: { create: [] } },
        include: expect.anything(),
      });
      expect(result.equipmentGroups).toEqual([]);
    });

    it('rechaza con NOT_FOUND si el ejercicio no existe o está borrado', async () => {
      prisma.exercise.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('inexistente', { name: 'x' }),
      ).rejects.toThrow(NotFoundWithCodeException);
    });

    it('rechaza con NAME_TAKEN si otro ejercicio activo ya tiene ese nombre', async () => {
      prisma.exercise.findFirst
        .mockResolvedValueOnce({ id: '1', name: 'push ups', deletedAt: null })
        .mockResolvedValueOnce({ id: '2', name: 'flexiones', deletedAt: null });

      await expect(service.update('1', { name: 'flexiones' })).rejects.toThrow(
        NameTakenException,
      );
    });

    it('rechaza con EQUIPMENT_NOT_FOUND si algún equipmentId nuevo no existe', async () => {
      prisma.exercise.findFirst
        .mockResolvedValueOnce({ id: '2', name: 'remos', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.equipment.findMany.mockResolvedValue([]);

      await expect(
        service.update('2', { name: 'remos', equipmentGroups: [['kbX']] }),
      ).rejects.toThrow(NotFoundWithCodeException);
      expect(prisma.exercise.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('hace soft delete cuando el ejercicio no está en uso', async () => {
      prisma.exercise.findFirst.mockResolvedValue({
        id: '1',
        name: 'push ups',
        deletedAt: null,
      });
      prisma.blockExercise.findFirst.mockResolvedValue(null);
      prisma.dayBlockExercise.findFirst.mockResolvedValue(null);
      prisma.exercise.update.mockResolvedValue({
        ...noGroupsRecord,
        deletedAt: new Date(),
      });

      const result = await service.remove('1');

      expect(prisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: anyDate() },
        include: expect.anything(),
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('rechaza con EXERCISE_IN_USE si un BlockExercise lo referencia', async () => {
      prisma.exercise.findFirst.mockResolvedValue({
        id: '1',
        name: 'push ups',
        deletedAt: null,
      });
      prisma.blockExercise.findFirst.mockResolvedValue({ id: 'be1' });

      await expect(service.remove('1')).rejects.toThrow(ExerciseInUseException);
      expect(prisma.exercise.update).not.toHaveBeenCalled();
    });

    it('rechaza con EXERCISE_IN_USE si un DayBlockExercise lo referencia', async () => {
      prisma.exercise.findFirst.mockResolvedValue({
        id: '1',
        name: 'push ups',
        deletedAt: null,
      });
      prisma.blockExercise.findFirst.mockResolvedValue(null);
      prisma.dayBlockExercise.findFirst.mockResolvedValue({ id: 'dbe1' });

      await expect(service.remove('1')).rejects.toThrow(ExerciseInUseException);
      expect(prisma.exercise.update).not.toHaveBeenCalled();
    });

    it('rechaza con NOT_FOUND si el ejercicio no existe', async () => {
      prisma.exercise.findFirst.mockResolvedValue(null);

      await expect(service.remove('inexistente')).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });
  });
});
