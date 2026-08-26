import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRoutineDto } from './create-routine.dto';

async function validateBody(body: Record<string, unknown>) {
  const instance = plainToInstance(CreateRoutineDto, body);
  return validate(instance);
}

const validBlock = {
  name: 'Fuerza EMOM 12',
  type: 'fuerza',
  advanceMode: 'manual',
  timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
  exercises: [{ exerciseId: 'ex1', reps: 12 }],
};

describe('CreateRoutineDto', () => {
  it('acepta una rutina válida con varios días y bloques', async () => {
    const errors = await validateBody({
      name: 'Plan semanal',
      days: [{ blocks: [validBlock] }, { blocks: [validBlock, validBlock] }],
    });

    expect(errors).toHaveLength(0);
  });

  it('rechaza una rutina sin días', async () => {
    const errors = await validateBody({ name: 'Plan semanal', days: [] });

    expect(errors.some((e) => e.property === 'days')).toBe(true);
  });

  it('rechaza un día sin bloques', async () => {
    const errors = await validateBody({
      name: 'Plan semanal',
      days: [{ blocks: [] }],
    });

    expect(errors.some((e) => e.property === 'days')).toBe(true);
  });

  it('propaga errores de timerConfig inválido dentro de un bloque anidado', async () => {
    const errors = await validateBody({
      name: 'Plan semanal',
      days: [
        {
          blocks: [
            { ...validBlock, timerConfig: { totalDurationSeconds: 720 } },
          ],
        },
      ],
    });

    expect(errors.some((e) => e.property === 'days')).toBe(true);
  });

  it('rechaza sin nombre de rutina', async () => {
    const errors = await validateBody({
      days: [{ blocks: [validBlock] }],
    });

    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
