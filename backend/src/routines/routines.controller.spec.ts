import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

function createServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

const dto: CreateRoutineDto = {
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

describe('RoutinesController', () => {
  let controller: RoutinesController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new RoutinesController(service as unknown as RoutinesService);
  });

  it('GET / delega en el service.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 'r1' }]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'r1' }]);
  });

  it('GET /:id delega en el service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'r1', days: [] });

    const result = await controller.findOne('r1');

    expect(service.findOne).toHaveBeenCalledWith('r1');
    expect(result).toEqual({ id: 'r1', days: [] });
  });

  it('POST delega en el service.create', async () => {
    service.create.mockResolvedValue({ id: 'r1' });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'r1' });
  });

  it('PUT delega en el service.update', async () => {
    service.update.mockResolvedValue({ id: 'r1' });

    const result = await controller.update('r1', dto);

    expect(service.update).toHaveBeenCalledWith('r1', dto);
    expect(result).toEqual({ id: 'r1' });
  });

  it('DELETE delega en el service.remove', async () => {
    service.remove.mockResolvedValue({
      id: 'r1',
      deletedAt: new Date(),
    });

    const result = await controller.remove('r1');

    expect(service.remove).toHaveBeenCalledWith('r1');
    expect(result).toHaveProperty('deletedAt');
  });
});
