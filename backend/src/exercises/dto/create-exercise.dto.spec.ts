import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExerciseDto } from './create-exercise.dto';

async function validateBody(body: Record<string, unknown>) {
  const instance = plainToInstance(CreateExerciseDto, body);
  return validate(instance);
}

describe('CreateExerciseDto', () => {
  it('acepta un ejercicio sin equipmentGroups (peso corporal)', async () => {
    const errors = await validateBody({ name: 'burpees' });

    expect(errors).toHaveLength(0);
  });

  it('acepta un ejercicio con equipmentGroups vacío', async () => {
    const errors = await validateBody({ name: 'burpees', equipmentGroups: [] });

    expect(errors).toHaveLength(0);
  });

  it('acepta un ejercicio con un grupo de un solo elemento', async () => {
    const errors = await validateBody({
      name: 'goblet squats con kettlebell',
      equipmentGroups: [['kb1']],
    });

    expect(errors).toHaveLength(0);
  });

  it('acepta un ejercicio con un grupo de alternativas', async () => {
    const errors = await validateBody({
      name: 'remos',
      equipmentGroups: [['kb1', 'mc1']],
    });

    expect(errors).toHaveLength(0);
  });

  it('acepta un ejercicio con varios grupos (uno por cada uno, "Y" entre grupos)', async () => {
    const errors = await validateBody({
      name: 'ejercicio compuesto',
      equipmentGroups: [['kb1'], ['banco1']],
    });

    expect(errors).toHaveLength(0);
  });

  it('rechaza un grupo vacío (RN-014)', async () => {
    const errors = await validateBody({
      name: 'remos',
      equipmentGroups: [[]],
    });

    expect(errors.some((e) => e.property === 'equipmentGroups')).toBe(true);
  });

  it('rechaza equipmentGroups que no es una lista de listas', async () => {
    const errors = await validateBody({
      name: 'remos',
      equipmentGroups: ['kb1'],
    });

    expect(errors.some((e) => e.property === 'equipmentGroups')).toBe(true);
  });
});
