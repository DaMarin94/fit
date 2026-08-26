import { describe, expect, it } from "vitest";
import { buildSessionPlan } from "./session-plan";
import {
  advance,
  continueNextBlock,
  createInitialState,
  getView,
  pause,
  resume,
  start,
  tick,
} from "./session-engine";
import type { RoutineDay, RoutineDayBlock } from "@/types/domain";

function be(exerciseId: string, order: number, extra: Partial<{ reps: number | null; duration: number | null }> = {}) {
  return { id: `be-${exerciseId}-${order}`, exerciseId, order, reps: extra.reps ?? null, duration: extra.duration ?? null };
}

function day(blocks: RoutineDayBlock[]): RoutineDay {
  return { id: "day-1", order: 0, blocks };
}

describe("session-engine — fuerza (EMOM), un solo bloque", () => {
  const block: RoutineDayBlock = {
    id: "b1",
    order: 0,
    name: "Fuerza EMOM",
    type: "fuerza",
    timerConfig: { totalDurationSeconds: 120, taskIntervalSeconds: 60 },
    advanceMode: "manual",
    exercises: [be("ex-a", 0), be("ex-b", 1)],
  };
  const plan = buildSessionPlan(day([block]));

  it("arranca en idle, listo para empezar", () => {
    const state = createInitialState(plan);
    expect(state.status).toBe("idle");
    const view = getView(plan, state);
    expect(view.phase).toBe("idle");
    expect(view.blockIndex).toBe(0);
    expect(view.totalBlocks).toBe(1);
  });

  it("start() pasa a running en el primer paso", () => {
    let state = createInitialState(plan);
    state = start(plan, state);
    expect(state.status).toBe("running");
    const view = getView(plan, state);
    expect(view.phase).toBe("work");
    expect(view.exerciseIndex).toBe(0);
    expect(view.remainingSeconds).toBe(60);
  });

  it("tick descuenta el tiempo restante del paso actual", () => {
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 10);
    expect(state.remainingSeconds).toBe(50);
    expect(state.status).toBe("running");
  });

  it("al agotarse un intervalo, avisa la transición y pasa al siguiente ejercicio", () => {
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 60);
    expect(state.transitions.exerciseChanged).toBe(true);
    const view = getView(plan, state);
    expect(view.exerciseIndex).toBe(1);
    expect(view.remainingSeconds).toBe(60);
  });

  it("pausar detiene el avance del tiempo; reanudar lo retoma", () => {
    let state = start(plan, createInitialState(plan));
    state = pause(plan, state);
    expect(state.status).toBe("paused");
    state = tick(plan, state, 30);
    expect(state.remainingSeconds).toBe(60); // no se movió en pausa
    state = resume(plan, state);
    expect(state.status).toBe("running");
    state = tick(plan, state, 10);
    expect(state.remainingSeconds).toBe(50);
  });

  it("avanzar salta directo al siguiente paso sin esperar el tiempo", () => {
    let state = start(plan, createInitialState(plan));
    state = advance(plan, state);
    expect(state.transitions.exerciseChanged).toBe(true);
    const view = getView(plan, state);
    expect(view.exerciseIndex).toBe(1);
  });

  it("al terminar el último paso del único bloque del día, la sesión termina", () => {
    let state = start(plan, createInitialState(plan));
    state = advance(plan, state); // exercise 1
    state = advance(plan, state); // agota el bloque (2 pasos en total)
    expect(state.status).toBe("finished");
    expect(state.transitions.sessionFinished).toBe(true);
  });
});

describe("session-engine — avance entre bloques", () => {
  const auto: RoutineDayBlock = {
    id: "b1",
    order: 0,
    name: "Bloque automático",
    type: "fuerza",
    timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
    advanceMode: "automatico",
    exercises: [be("ex-a", 0)],
  };
  const manual: RoutineDayBlock = {
    id: "b2",
    order: 1,
    name: "Bloque manual",
    type: "fuerza",
    timerConfig: { totalDurationSeconds: 60, taskIntervalSeconds: 60 },
    advanceMode: "manual",
    exercises: [be("ex-b", 0)],
  };

  it("con avance automático, el siguiente bloque arranca solo", () => {
    const plan = buildSessionPlan(day([auto, manual]));
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 60);
    expect(state.status).toBe("running");
    expect(state.blockIndex).toBe(1);
    expect(state.transitions.blockChanged).toBe(true);
    const view = getView(plan, state);
    expect(view.block?.id).toBe("b2");
  });

  it("con avance manual, el bloque termina y espera confirmación", () => {
    const plan = buildSessionPlan(day([manual, auto]));
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 60);
    expect(state.status).toBe("waiting-next-block");
    expect(state.transitions.blockCompleted).toBe(true);
    expect(state.blockIndex).toBe(0);
  });

  it("continueNextBlock() arranca el siguiente bloque tras la confirmación", () => {
    const plan = buildSessionPlan(day([manual, auto]));
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 60);
    state = continueNextBlock(plan, state);
    expect(state.status).toBe("running");
    expect(state.blockIndex).toBe(1);
    const view = getView(plan, state);
    expect(view.block?.id).toBe("b1");
  });

  it("el último bloque del día siempre termina la sesión, sin importar su advanceMode", () => {
    const lastManual: RoutineDayBlock = { ...manual, id: "b-last" };
    const plan = buildSessionPlan(day([auto, lastManual]));
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 60); // termina auto, arranca lastManual
    state = tick(plan, state, 60); // termina lastManual (es el último bloque)
    expect(state.status).toBe("finished");
    expect(state.transitions.sessionFinished).toBe(true);
  });
});

describe("session-engine — metcon (AMRAP)", () => {
  const block: RoutineDayBlock = {
    id: "b1",
    order: 0,
    name: "Metcon AMRAP",
    type: "metcon",
    timerConfig: { totalDurationSeconds: 360 },
    advanceMode: "automatico",
    exercises: [be("ex-a", 0), be("ex-b", 1)],
  };
  const plan = buildSessionPlan(day([block]));

  it("la cuenta regresiva corre sola; avanzar cicla el ejercicio sin tocar el tiempo", () => {
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 30);
    expect(state.remainingSeconds).toBe(330);

    state = advance(plan, state);
    expect(state.transitions.exerciseChanged).toBe(true);
    let view = getView(plan, state);
    expect(view.exerciseIndex).toBe(1);
    expect(view.remainingSeconds).toBe(330); // el avance no consume tiempo

    state = advance(plan, state); // vuelve a completar la vuelta -> nueva ronda
    expect(state.transitions.roundChanged).toBe(true);
    view = getView(plan, state);
    expect(view.exerciseIndex).toBe(0);
    expect(view.round).toBe(2);
  });

  it("al agotarse el tiempo total, el bloque termina (es AMRAP: no hay pasos, hay reloj)", () => {
    let state = start(plan, createInitialState(plan));
    state = tick(plan, state, 360);
    expect(state.status).toBe("finished");
  });
});

describe("session-engine — intervalos", () => {
  const block: RoutineDayBlock = {
    id: "b1",
    order: 0,
    name: "Intervalos",
    type: "intervalos",
    timerConfig: { workSeconds: 30, restSeconds: 15, rounds: 2 },
    advanceMode: "manual",
    exercises: [be("ex-a", 0), be("ex-b", 1)],
  };
  const plan = buildSessionPlan(day([block]));

  it("alterna work y rest, avisando el cambio de fase", () => {
    let state = start(plan, createInitialState(plan));
    expect(getView(plan, state).phase).toBe("work");
    state = tick(plan, state, 30);
    expect(state.transitions.phaseChanged).toBe(true);
    expect(getView(plan, state).phase).toBe("rest");
  });
});

describe("session-engine — día sin bloques", () => {
  it("no revienta: arranca directamente en finished", () => {
    const plan = buildSessionPlan(day([]));
    const state = createInitialState(plan);
    expect(state.status).toBe("idle");
    const started = start(plan, state);
    expect(started.status).toBe("finished");
  });
});
