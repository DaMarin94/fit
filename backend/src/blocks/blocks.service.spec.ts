import { BlocksService } from './blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';
import { CreateBlockDto } from './dto/create-block.dto';
import { anyDate } from '../test-utils/matchers';

function createPrismaMock() {
  return {
    block: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blockExercise: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const validCreateDto: CreateBlockDto = {
  name: 'Fuerza EMOM 12',
  type: 'fuerza',
  advanceMode: 'manual',
  timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
  exercises: [
    { exerciseId: 'ex1', reps: 12 },
    { exerciseId: 'ex2', reps: 10 },
  ],
};

describe('BlocksService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: BlocksService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    service = new BlocksService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('lista solo bloques no borrados, con sus ejercicios ordenados', async () => {
      prisma.block.findMany.mockResolvedValue([{ id: 'b1', exercises: [] }]);

      const result = await service.findAll();

      expect(prisma.block.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result).toEqual([{ id: 'b1', exercises: [] }]);
    });
  });

  describe('create', () => {
    it('crea el bloque con sus ejercicios ordenados por posición', async () => {
      prisma.block.findFirst.mockResolvedValue(null);
      prisma.block.create.mockResolvedValue({ id: 'b1', ...validCreateDto });

      const result = await service.create(validCreateDto);

      expect(prisma.block.create).toHaveBeenCalledWith({
        data: {
          name: validCreateDto.name,
          type: validCreateDto.type,
          advanceMode: validCreateDto.advanceMode,
          timerConfig: validCreateDto.timerConfig,
          exercises: {
            create: [
              { exerciseId: 'ex1', order: 0, reps: 12, duration: undefined },
              { exerciseId: 'ex2', order: 1, reps: 10, duration: undefined },
            ],
          },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      expect(result.id).toBe('b1');
    });

    it('rechaza con NAME_TAKEN si ya existe un bloque activo con ese nombre', async () => {
      prisma.block.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(validCreateDto)).rejects.toThrow(
        NameTakenException,
      );
      expect(prisma.block.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('reemplaza nombre, config y ejercicios de un bloque existente', async () => {
      prisma.block.findFirst
        .mockResolvedValueOnce({ id: 'b1', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.blockExercise.deleteMany.mockResolvedValue({ count: 2 });
      prisma.block.update.mockResolvedValue({ id: 'b1', ...validCreateDto });

      const result = await service.update('b1', validCreateDto);

      expect(prisma.blockExercise.deleteMany).toHaveBeenCalledWith({
        where: { blockId: 'b1' },
      });
      expect(prisma.block.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: {
          name: validCreateDto.name,
          type: validCreateDto.type,
          advanceMode: validCreateDto.advanceMode,
          timerConfig: validCreateDto.timerConfig,
          exercises: {
            create: [
              { exerciseId: 'ex1', order: 0, reps: 12, duration: undefined },
              { exerciseId: 'ex2', order: 1, reps: 10, duration: undefined },
            ],
          },
        },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      expect(result.id).toBe('b1');
    });

    it('rechaza con NOT_FOUND si el bloque no existe', async () => {
      prisma.block.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('inexistente', validCreateDto),
      ).rejects.toThrow(NotFoundWithCodeException);
    });
  });

  describe('remove', () => {
    it('hace soft delete sin bloquear por uso (RN-002)', async () => {
      prisma.block.findFirst.mockResolvedValue({ id: 'b1', deletedAt: null });
      prisma.block.update.mockResolvedValue({
        id: 'b1',
        deletedAt: new Date(),
      });

      const result = await service.remove('b1');

      expect(prisma.block.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { deletedAt: anyDate() },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('rechaza con NOT_FOUND si el bloque no existe o ya está borrado', async () => {
      prisma.block.findFirst.mockResolvedValue(null);

      await expect(service.remove('inexistente')).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });
  });
});
