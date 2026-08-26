import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

function createServiceMock() {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new EquipmentController(
      service as unknown as EquipmentService,
    );
  });

  it('GET delega en el service.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('POST delega en el service.create', async () => {
    const dto = { name: 'kettlebell' };
    service.create.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', name: 'kettlebell' });
  });

  it('PATCH delega en el service.update', async () => {
    const dto = { name: 'pesa rusa' };
    service.update.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({ id: '1', name: 'pesa rusa' });
  });

  it('DELETE delega en el service.remove', async () => {
    service.remove.mockResolvedValue({
      id: '1',
      deletedAt: new Date(),
    });

    const result = await controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith('1');
    expect(result).toHaveProperty('deletedAt');
  });
});
