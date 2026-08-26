import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

function createServiceMock() {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

const dto: CreateBlockDto = {
  name: 'Fuerza',
  type: 'fuerza',
  advanceMode: 'manual',
  timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
  exercises: [{ exerciseId: 'ex1', reps: 12 }],
};

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new BlocksController(service as unknown as BlocksService);
  });

  it('GET delega en el service.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 'b1' }]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'b1' }]);
  });

  it('POST delega en el service.create', async () => {
    service.create.mockResolvedValue({ id: 'b1' });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'b1' });
  });

  it('PATCH delega en el service.update', async () => {
    service.update.mockResolvedValue({ id: 'b1' });

    const result = await controller.update('b1', dto);

    expect(service.update).toHaveBeenCalledWith('b1', dto);
    expect(result).toEqual({ id: 'b1' });
  });

  it('DELETE delega en el service.remove', async () => {
    service.remove.mockResolvedValue({
      id: 'b1',
      deletedAt: new Date(),
    });

    const result = await controller.remove('b1');

    expect(service.remove).toHaveBeenCalledWith('b1');
    expect(result).toHaveProperty('deletedAt');
  });
});
