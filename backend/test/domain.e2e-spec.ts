import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * E2E de los módulos de dominio de Fase 1, contra la Postgres local real
 * (technical.md §Migraciones: "la base local de desarrollo es descartable").
 * Cubre el flujo completo: ejercicio → bloque → rutina → terminar
 * entrenamiento → historial, más los errores de negocio principales.
 */

interface ApiError {
  message: string;
  code: string;
}

interface ExerciseRecord {
  id: string;
  name: string;
  deletedAt: string | null;
}

interface BlockExerciseRecord {
  id: string;
  exerciseId: string;
  order: number;
  reps: number | null;
  duration: number | null;
}

interface BlockRecord {
  id: string;
  name: string;
  type: string;
  timerConfig: Record<string, number>;
  advanceMode: string;
  deletedAt: string | null;
  exercises: BlockExerciseRecord[];
}

interface DayBlockRecord {
  id: string;
  order: number;
  name: string;
  type: string;
  timerConfig: Record<string, number>;
  advanceMode: string;
  exercises: BlockExerciseRecord[];
}

interface DayRecord {
  id: string;
  order: number;
  blocks: DayBlockRecord[];
}

interface RoutineListItem {
  id: string;
  name: string;
  dayCount: number;
}

interface RoutineDetail {
  id: string;
  name: string;
  deletedAt: string | null;
  days: DayRecord[];
}

interface WorkoutLogRecord {
  id: string;
  performedAt: string;
  snapshot: unknown;
}

function getData<T>(response: request.Response): T {
  return (response.body as { data: T }).data;
}

function getError(response: request.Response): ApiError {
  return (response.body as { error: ApiError }).error;
}

describe('Dominio Fase 1 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const exerciseName = `E2E exercise ${suffix}`;
  const blockName = `E2E block ${suffix}`;
  const routineName = `E2E routine ${suffix}`;

  let exerciseId: string;
  let blockId: string;
  let routineId: string;
  let dayId: string;
  let workoutLogId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Limpieza física, en orden que respeta las FK (RN-008 solo aplica al
    // borrado vía API; acá limpiamos directo la data de prueba).
    if (workoutLogId) {
      await prisma.workoutLog.deleteMany({ where: { id: workoutLogId } });
    }
    if (routineId) {
      await prisma.routine
        .delete({ where: { id: routineId } })
        .catch(() => undefined);
    }
    if (blockId) {
      await prisma.block
        .delete({ where: { id: blockId } })
        .catch(() => undefined);
    }
    if (exerciseId) {
      await prisma.exercise
        .delete({ where: { id: exerciseId } })
        .catch(() => undefined);
    }
    await app.close();
  });

  it('crea un ejercicio', async () => {
    const response = await request(app.getHttpServer())
      .post('/exercises')
      .send({ name: exerciseName })
      .expect(201);

    const exercise = getData<ExerciseRecord>(response);
    expect(exercise).toMatchObject({ name: exerciseName, deletedAt: null });
    exerciseId = exercise.id;
  });

  it('rechaza un nombre de ejercicio duplicado con NAME_TAKEN', async () => {
    const response = await request(app.getHttpServer())
      .post('/exercises')
      .send({ name: exerciseName })
      .expect(409);

    expect(getError(response).code).toBe('NAME_TAKEN');
  });

  it('lista ejercicios activos', async () => {
    const response = await request(app.getHttpServer())
      .get('/exercises')
      .expect(200);

    const exercises = getData<ExerciseRecord[]>(response);
    expect(exercises.some((exercise) => exercise.id === exerciseId)).toBe(true);
  });

  it('rechaza un bloque con timerConfig inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/blocks')
      .send({
        name: `${blockName} inválido`,
        type: 'fuerza',
        advanceMode: 'manual',
        timerConfig: { totalDurationSeconds: 720 },
        exercises: [{ exerciseId, reps: 12 }],
      })
      .expect(400);

    expect(getError(response).code).toBe('VALIDATION_ERROR');
  });

  it('crea un bloque de tipo fuerza referenciando al ejercicio', async () => {
    const response = await request(app.getHttpServer())
      .post('/blocks')
      .send({
        name: blockName,
        type: 'fuerza',
        advanceMode: 'manual',
        timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
        exercises: [{ exerciseId, reps: 12 }],
      })
      .expect(201);

    const block = getData<BlockRecord>(response);
    expect(block.exercises).toHaveLength(1);
    blockId = block.id;
  });

  it('bloquea el borrado del ejercicio en uso por el bloque', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/exercises/${exerciseId}`)
      .expect(409);

    expect(getError(response).code).toBe('EXERCISE_IN_USE');
  });

  it('crea una rutina con el árbol completo (día con el bloque copiado)', async () => {
    const response = await request(app.getHttpServer())
      .post('/routines')
      .send({
        name: routineName,
        days: [
          {
            blocks: [
              {
                name: blockName,
                type: 'fuerza',
                advanceMode: 'manual',
                timerConfig: {
                  totalDurationSeconds: 720,
                  taskIntervalSeconds: 60,
                },
                exercises: [{ exerciseId, reps: 12 }],
              },
            ],
          },
        ],
      })
      .expect(201);

    const routine = getData<RoutineDetail>(response);
    routineId = routine.id;
    dayId = routine.days[0].id;
    expect(routine.days[0].blocks[0].exercises[0].exerciseId).toBe(exerciseId);
  });

  it('lista rutinas con id, name y dayCount', async () => {
    const response = await request(app.getHttpServer())
      .get('/routines')
      .expect(200);

    const routines = getData<RoutineListItem[]>(response);
    const found = routines.find((routine) => routine.id === routineId);
    expect(found).toMatchObject({ name: routineName, dayCount: 1 });
  });

  it('devuelve 404 ROUTINE_NOT_FOUND para una rutina inexistente', async () => {
    const response = await request(app.getHttpServer())
      .get('/routines/inexistente')
      .expect(404);

    expect(getError(response).code).toBe('ROUTINE_NOT_FOUND');
  });

  it('termina el entrenamiento y guarda un WorkoutLog con el snapshot', async () => {
    const response = await request(app.getHttpServer())
      .post(`/routines/${routineId}/days/${dayId}/workout-logs`)
      .send({})
      .expect(201);

    const workoutLog = getData<WorkoutLogRecord>(response);
    expect(workoutLog.snapshot).toMatchObject({
      routineName,
      blocks: [
        {
          name: blockName,
          type: 'fuerza',
          exercises: [{ name: exerciseName, reps: 12 }],
        },
      ],
    });
    workoutLogId = workoutLog.id;
  });

  it('lista el historial e incluye el registro recién creado', async () => {
    const response = await request(app.getHttpServer())
      .get('/workout-logs')
      .expect(200);

    const logs = getData<WorkoutLogRecord[]>(response);
    expect(logs.some((log) => log.id === workoutLogId)).toBe(true);
  });

  it('borra el bloque del pool sin afectar la rutina que ya lo copió (RN-002)', async () => {
    await request(app.getHttpServer()).delete(`/blocks/${blockId}`).expect(200);

    const routineResponse = await request(app.getHttpServer())
      .get(`/routines/${routineId}`)
      .expect(200);

    const routine = getData<RoutineDetail>(routineResponse);
    expect(routine.days[0].blocks[0].name).toBe(blockName);
  });
});
