import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBlockDto } from './create-block.dto';

async function validateBody(body: Record<string, unknown>) {
  const instance = plainToInstance(CreateBlockDto, body);
  return validate(instance);
}

describe('CreateBlockDto', () => {
  it('acepta un bloque fuerza (EMOM) válido', async () => {
    const errors = await validateBody({
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      exercises: [{ exerciseId: 'ex1', reps: 12 }],
    });

    expect(errors).toHaveLength(0);
  });

  it('acepta un bloque metcon (AMRAP) válido', async () => {
    const errors = await validateBody({
      name: 'Metcon AMRAP 6',
      type: 'metcon',
      advanceMode: 'automatico',
      timerConfig: { totalDurationSeconds: 360 },
      exercises: [{ exerciseId: 'ex1', reps: 20 }],
    });

    expect(errors).toHaveLength(0);
  });

  it('acepta un bloque intervalos válido sin reps/duration en los ejercicios', async () => {
    const errors = await validateBody({
      name: 'Metcon intervalos 30/15',
      type: 'intervalos',
      advanceMode: 'manual',
      timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
      exercises: [{ exerciseId: 'ex1' }, { exerciseId: 'ex2' }],
    });

    expect(errors).toHaveLength(0);
  });

  it('acepta un bloque cardio_libre válido con duration y sin reps', async () => {
    const errors = await validateBody({
      name: 'Trote',
      type: 'cardio_libre',
      advanceMode: 'manual',
      timerConfig: {},
      exercises: [
        { exerciseId: 'ex1', duration: 300 },
        { exerciseId: 'ex2', duration: 900 },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('rechaza timerConfig incompleto para fuerza', async () => {
    const errors = await validateBody({
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 720 },
      exercises: [{ exerciseId: 'ex1', reps: 12 }],
    });

    expect(errors.some((e) => e.property === 'timerConfig')).toBe(true);
  });

  it('rechaza timerConfig con números no positivos', async () => {
    const errors = await validateBody({
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 0, taskIntervalSeconds: 60 },
      exercises: [{ exerciseId: 'ex1', reps: 12 }],
    });

    expect(errors.some((e) => e.property === 'timerConfig')).toBe(true);
  });

  it('rechaza timerConfig con campos extra no declarados para el tipo', async () => {
    const errors = await validateBody({
      name: 'Metcon AMRAP 6',
      type: 'metcon',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 360, extra: 1 },
      exercises: [{ exerciseId: 'ex1', reps: 20 }],
    });

    expect(errors.some((e) => e.property === 'timerConfig')).toBe(true);
  });

  it('rechaza un ejercicio con reps en un bloque de intervalos', async () => {
    const errors = await validateBody({
      name: 'Metcon intervalos 30/15',
      type: 'intervalos',
      advanceMode: 'manual',
      timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
      exercises: [{ exerciseId: 'ex1', reps: 10 }],
    });

    expect(errors.some((e) => e.property === 'exercises')).toBe(true);
  });

  it('rechaza un ejercicio sin duration en un bloque cardio_libre', async () => {
    const errors = await validateBody({
      name: 'Trote',
      type: 'cardio_libre',
      advanceMode: 'manual',
      timerConfig: {},
      exercises: [{ exerciseId: 'ex1' }],
    });

    expect(errors.some((e) => e.property === 'exercises')).toBe(true);
  });

  it('rechaza reps o duration no positivos', async () => {
    const errors = await validateBody({
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      exercises: [{ exerciseId: 'ex1', reps: -1 }],
    });

    expect(errors.some((e) => e.property === 'exercises')).toBe(true);
  });

  it('rechaza una lista de ejercicios vacía', async () => {
    const errors = await validateBody({
      name: 'Fuerza EMOM 12',
      type: 'fuerza',
      advanceMode: 'manual',
      timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
      exercises: [],
    });

    expect(errors.some((e) => e.property === 'exercises')).toBe(true);
  });

  it('rechaza un type fuera de la lista cerrada', async () => {
    const errors = await validateBody({
      name: 'Bloque raro',
      type: 'yoga',
      advanceMode: 'manual',
      timerConfig: {},
      exercises: [{ exerciseId: 'ex1' }],
    });

    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });
});
