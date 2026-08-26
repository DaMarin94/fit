import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';
import { anyDate } from '../test-utils/matchers';
import {
  EquipmentInUseException,
  NameTakenException,
  NotFoundWithCodeException,
} from '../common/exceptions/domain.exceptions';

function createPrismaMock() {
  return {
    equipment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    equipmentGroupItem: {
      findFirst: jest.fn(),
    },
  };
}

describe('EquipmentService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new EquipmentService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('lista solo los elementos no borrados', async () => {
      prisma.equipment.findMany.mockResolvedValue([
        { id: '1', name: 'kettlebell', deletedAt: null },
      ]);

      const result = await service.findAll();

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result).toEqual([
        { id: '1', name: 'kettlebell', deletedAt: null },
      ]);
    });
  });

  describe('create', () => {
    it('crea el elemento cuando el nombre está disponible', async () => {
      prisma.equipment.findFirst.mockResolvedValue(null);
      prisma.equipment.create.mockResolvedValue({
        id: '1',
        name: 'kettlebell',
        deletedAt: null,
      });

      const result = await service.create({ name: 'kettlebell' });

      expect(prisma.equipment.create).toHaveBeenCalledWith({
        data: { name: 'kettlebell' },
      });
      expect(result).toEqual({
        id: '1',
        name: 'kettlebell',
        deletedAt: null,
      });
    });

    it('rechaza con NAME_TAKEN si ya existe un elemento activo con ese nombre', async () => {
      prisma.equipment.findFirst.mockResolvedValue({
        id: '1',
        name: 'kettlebell',
        deletedAt: null,
      });

      await expect(service.create({ name: 'kettlebell' })).rejects.toThrow(
        NameTakenException,
      );
      expect(prisma.equipment.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('actualiza el nombre cuando el elemento existe y el nombre está disponible', async () => {
      prisma.equipment.findFirst
        .mockResolvedValueOnce({ id: '1', name: 'kettlebell', deletedAt: null })
        .mockResolvedValueOnce(null);
      prisma.equipment.update.mockResolvedValue({
        id: '1',
        name: 'pesa rusa',
        deletedAt: null,
      });

      const result = await service.update('1', { name: 'pesa rusa' });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'pesa rusa' },
      });
      expect(result.name).toBe('pesa rusa');
    });

    it('rechaza con NOT_FOUND si el elemento no existe o está borrado', async () => {
      prisma.equipment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('inexistente', { name: 'x' }),
      ).rejects.toThrow(NotFoundWithCodeException);
    });

    it('rechaza con NAME_TAKEN si otro elemento activo ya tiene ese nombre', async () => {
      prisma.equipment.findFirst
        .mockResolvedValueOnce({ id: '1', name: 'kettlebell', deletedAt: null })
        .mockResolvedValueOnce({ id: '2', name: 'mancuernas', deletedAt: null });

      await expect(
        service.update('1', { name: 'mancuernas' }),
      ).rejects.toThrow(NameTakenException);
    });
  });

  describe('remove', () => {
    it('hace soft delete cuando el elemento no está en uso', async () => {
      prisma.equipment.findFirst.mockResolvedValue({
        id: '1',
        name: 'kettlebell',
        deletedAt: null,
      });
      prisma.equipmentGroupItem.findFirst.mockResolvedValue(null);
      prisma.equipment.update.mockResolvedValue({
        id: '1',
        name: 'kettlebell',
        deletedAt: new Date(),
      });

      const result = await service.remove('1');

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: anyDate() },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('rechaza con EQUIPMENT_IN_USE si algún grupo de equipo lo referencia', async () => {
      prisma.equipment.findFirst.mockResolvedValue({
        id: '1',
        name: 'kettlebell',
        deletedAt: null,
      });
      prisma.equipmentGroupItem.findFirst.mockResolvedValue({ id: 'egi1' });

      await expect(service.remove('1')).rejects.toThrow(
        EquipmentInUseException,
      );
      expect(prisma.equipment.update).not.toHaveBeenCalled();
    });

    it('rechaza con NOT_FOUND si el elemento no existe', async () => {
      prisma.equipment.findFirst.mockResolvedValue(null);

      await expect(service.remove('inexistente')).rejects.toThrow(
        NotFoundWithCodeException,
      );
    });
  });
});
