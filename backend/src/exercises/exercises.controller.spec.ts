import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

function createServiceMock() {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('ExercisesController', () => {
  let controller: ExercisesController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ExercisesController(
      service as unknown as ExercisesService,
    );
  });

  it('GET delega en el service.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([{ id: '1' }]);
  });

  it('GET con ?equipmentId lo pasa al service.findAll (RF-018)', async () => {
    service.findAll.mockResolvedValue([{ id: '1' }]);

    const result = await controller.findAll('eq1');

    expect(service.findAll).toHaveBeenCalledWith('eq1');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('POST delega en el service.create', async () => {
    const dto = { name: 'push ups' };
    service.create.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', name: 'push ups' });
  });

  it('PATCH delega en el service.update', async () => {
    const dto = { name: 'flexiones' };
    service.update.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({ id: '1', name: 'flexiones' });
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
