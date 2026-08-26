import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { deleteFitDbForTests, getFitDb } from "./db";

describe("lib/offline/db", () => {
  afterEach(async () => {
    await deleteFitDbForTests();
  });

  it("abre la base y crea los dos object stores esperados", async () => {
    const db = await getFitDb();

    expect(Array.from(db.objectStoreNames)).toEqual(
      expect.arrayContaining(["training-cache", "workout-log-queue"]),
    );
  });

  it("reutiliza la misma conexión entre llamadas", async () => {
    const first = await getFitDb();
    const second = await getFitDb();

    expect(first).toBe(second);
  });
});
