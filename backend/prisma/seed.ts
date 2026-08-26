import { AdvanceMode, BlockType, PrismaClient } from '@prisma/client';

/**
 * Semilla de datos de ejemplo (docs/requirements.md §6, docs/technical.md
 * §Migraciones y semilla): ejercicios y bloques del pool, y una rutina de
 * ejemplo ("Plan semanal") que encadena copias de esos bloques en 5 días.
 *
 * Idempotente: si "Plan semanal" ya existe (no borrada), no vuelve a correr
 * para no violar la unicidad de nombres (RN-005) en una re-ejecución.
 */
const prisma = new PrismaClient();

type ExerciseSeed = { name: string };

type BlockExerciseSeed = { exerciseName: string; reps?: number; duration?: number };

type BlockSeed = {
  name: string;
  type: BlockType;
  timerConfig: Record<string, number>;
  advanceMode: AdvanceMode;
  exercises: BlockExerciseSeed[];
};

const EXERCISES: ExerciseSeed[] = [
  { name: 'goblet squats con kettlebell' },
  { name: 'zancadas con mancuernas' },
  { name: 'swings con kettlebell' },
  { name: 'sentadillas con kettlebell' },
  { name: 'shoulder press con mancuernas' },
  { name: 'saltos con soga' },
  { name: 'dips en silla' },
  { name: 'remos' },
  { name: 'burpees' },
  { name: 'sit ups' },
  { name: 'push ups' },
  { name: 'jumping jacks' },
  { name: 'plancha' },
  { name: 'trote suave' },
  { name: 'trote a ritmo constante' },
];

const BLOCKS: BlockSeed[] = [
  {
    name: "Fuerza EMOM 12'",
    type: BlockType.fuerza,
    timerConfig: { totalDurationSeconds: 720, taskIntervalSeconds: 60 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'goblet squats con kettlebell', reps: 12 },
      { exerciseName: 'zancadas con mancuernas', reps: 10 },
      { exerciseName: 'swings con kettlebell', reps: 12 },
    ],
  },
  {
    name: "Metcon AMRAP 6'",
    type: BlockType.metcon,
    timerConfig: { totalDurationSeconds: 360 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'saltos con soga', reps: 20 },
      { exerciseName: 'burpees', reps: 10 },
      { exerciseName: 'sit ups', reps: 10 },
    ],
  },
  {
    name: "Fuerza EMOM 10'",
    type: BlockType.fuerza,
    timerConfig: { totalDurationSeconds: 600, taskIntervalSeconds: 60 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'push ups', reps: 12 },
      { exerciseName: 'shoulder press con mancuernas', reps: 10 },
    ],
  },
  {
    name: 'Metcon intervalos 30/15',
    type: BlockType.intervalos,
    timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'jumping jacks' },
      { exerciseName: 'swings con kettlebell' },
      { exerciseName: 'burpees' },
      { exerciseName: 'plancha' },
    ],
  },
  {
    name: "Fuerza AMRAP 12'",
    type: BlockType.metcon,
    timerConfig: { totalDurationSeconds: 720 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'sentadillas con kettlebell', reps: 8 },
      { exerciseName: 'remos', reps: 10 },
      { exerciseName: 'dips en silla', reps: 8 },
      { exerciseName: 'burpees', reps: 6 },
    ],
  },
  {
    name: "Finisher 3'",
    type: BlockType.metcon,
    timerConfig: { totalDurationSeconds: 180 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'saltos con soga', reps: 30 },
      { exerciseName: 'swings con kettlebell', reps: 10 },
    ],
  },
  {
    name: "Metabólico largo 15'",
    type: BlockType.metcon,
    timerConfig: { totalDurationSeconds: 900 },
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'saltos con soga', reps: 30 },
      { exerciseName: 'zancadas con mancuernas', reps: 20 },
      { exerciseName: 'swings con kettlebell', reps: 15 },
      { exerciseName: 'burpees', reps: 10 },
      { exerciseName: 'push ups', reps: 5 },
    ],
  },
  {
    name: 'Trote',
    type: BlockType.cardio_libre,
    timerConfig: {},
    advanceMode: AdvanceMode.manual,
    exercises: [
      { exerciseName: 'trote suave', duration: 300 },
      { exerciseName: 'trote a ritmo constante', duration: 900 },
      { exerciseName: 'trote suave', duration: 120 },
    ],
  },
];

/** Días de "Plan semanal": cada uno encadena copias de bloques del pool. */
const ROUTINE_NAME = 'Plan semanal';
const ROUTINE_DAYS: string[][] = [
  ["Fuerza EMOM 12'", "Metcon AMRAP 6'"],
  ["Fuerza EMOM 10'", 'Metcon intervalos 30/15'],
  ["Fuerza AMRAP 12'", "Finisher 3'"],
  ["Metabólico largo 15'"],
  ['Trote'],
];

async function main() {
  const existingRoutine = await prisma.routine.findFirst({
    where: { name: ROUTINE_NAME, deletedAt: null },
  });
  if (existingRoutine) {
    console.log(
      `Semilla omitida: ya existe la rutina "${ROUTINE_NAME}". No se vuelve a cargar.`,
    );
    return;
  }

  const exerciseIdByName = new Map<string, string>();
  for (const exercise of EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name, deletedAt: null },
    });
    const record =
      existing ?? (await prisma.exercise.create({ data: { name: exercise.name } }));
    exerciseIdByName.set(exercise.name, record.id);
  }
  console.log(`Ejercicios listos: ${exerciseIdByName.size}`);

  const blockByName = new Map<string, BlockSeed>();
  for (const block of BLOCKS) {
    blockByName.set(block.name, block);

    const existing = await prisma.block.findFirst({
      where: { name: block.name, deletedAt: null },
    });
    if (existing) {
      continue;
    }

    await prisma.block.create({
      data: {
        name: block.name,
        type: block.type,
        timerConfig: block.timerConfig,
        advanceMode: block.advanceMode,
        exercises: {
          create: block.exercises.map((exercise, order) => ({
            exerciseId: exerciseIdByName.get(exercise.exerciseName)!,
            order,
            reps: exercise.reps,
            duration: exercise.duration,
          })),
        },
      },
    });
  }
  console.log(`Bloques listos: ${BLOCKS.length}`);

  await prisma.routine.create({
    data: {
      name: ROUTINE_NAME,
      days: {
        create: ROUTINE_DAYS.map((blockNames, dayOrder) => ({
          order: dayOrder,
          blocks: {
            create: blockNames.map((blockName, blockOrder) => {
              const block = blockByName.get(blockName);
              if (!block) {
                throw new Error(
                  `Bloque "${blockName}" no está definido en BLOCKS.`,
                );
              }
              return {
                order: blockOrder,
                name: block.name,
                type: block.type,
                timerConfig: block.timerConfig,
                advanceMode: block.advanceMode,
                exercises: {
                  create: block.exercises.map((exercise, exerciseOrder) => ({
                    exerciseId: exerciseIdByName.get(exercise.exerciseName)!,
                    order: exerciseOrder,
                    reps: exercise.reps,
                    duration: exercise.duration,
                  })),
                },
              };
            }),
          },
        })),
      },
    },
  });
  console.log(`Rutina de ejemplo "${ROUTINE_NAME}" creada con 5 días.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
