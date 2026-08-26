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
    blockExercise: {
      findFirst: jest.fn(),
    },
    dayBlockExercise: {
      findFirst: jest.fn(),
    },
  };
}

describe('ExercisesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ExercisesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ExercisesService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('lista solo los ejercicios no borrados', async () => {
      prisma.exercise.findMany.mockResolvedValue([
        { id: '1', name: 'push ups', deletedAt: null },
      ]);

      const result = await service.findAll();

      expect(prisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result).toEqual([{ id: '1', name: 'push ups', deletedAt: null }]);
    });
  });

  describe('create', () => {
    it('crea el ejercicio cuando el nombre está disponible', async () => {
      prisma.exercise.findFirst.mockResolvedValue(null);
      prisma.exercise.create.mockResolvedValue({
        id: '1',
        name: 'push ups',
        deletedAt: null,
      });

      const result = await service.create({ name: 'push ups' });

      expect(prisma.exercise.create).toHaveBeenCalledWith({
        data: { name: 'push ups' },
      });
      expect(result).toEqual({ id: '1', name: 'push ups', deletedAt: null });
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
    it('actualiza el nombre cuando el ejercicio existe y el nombre está disponible', async () => {
      prisma.exercise.findFirst
        .mockResolvedValueOnce({ id: '1', name: 'push ups', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.exercise.update.mockResolvedValue({
        id: '1',
        name: 'flexiones',
        deletedAt: null,
      });

      const result = await service.update('1', { name: 'flexiones' });

      expect(prisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'flexiones' },
      });
      expect(result.name).toBe('flexiones');
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
        id: '1',
        name: 'push ups',
        deletedAt: new Date(),
      });

      const result = await service.remove('1');

      expect(prisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: anyDate() },
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
