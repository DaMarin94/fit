import { WorkoutLogsController } from './workout-logs.controller';
import { WorkoutLogsService } from './workout-logs.service';

function createServiceMock() {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
  };
}

describe('WorkoutLogsController', () => {
  let controller: WorkoutLogsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new WorkoutLogsController(
      service as unknown as WorkoutLogsService,
    );
  });

  it('POST delega en el service.create con routineId, dayId y body', async () => {
    const dto = { performedAt: '2026-08-20T10:00:00.000Z' };
    service.create.mockResolvedValue({ id: 'log1' });

    const result = await controller.create('r1', 'day1', dto);

    expect(service.create).toHaveBeenCalledWith('r1', 'day1', dto);
    expect(result).toEqual({ id: 'log1' });
  });

  it('GET delega en el service.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 'log1' }]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'log1' }]);
  });
});
