import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { OfflineSyncListener } from "./OfflineSyncListener";
import * as workoutLogSyncStatus from "@/lib/offline/workout-log-sync-status";

describe("OfflineSyncListener", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("si ya hay red al montar, sincroniza la cola pendiente", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const syncSpy = vi.spyOn(workoutLogSyncStatus, "runWorkoutLogSync").mockResolvedValue(undefined);

    render(<OfflineSyncListener />);

    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it("si no hay red al montar, no sincroniza todavía", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const syncSpy = vi.spyOn(workoutLogSyncStatus, "runWorkoutLogSync").mockResolvedValue(undefined);

    render(<OfflineSyncListener />);

    expect(syncSpy).not.toHaveBeenCalled();
  });

  it("al reconectar (evento online), sincroniza la cola pendiente", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const syncSpy = vi.spyOn(workoutLogSyncStatus, "runWorkoutLogSync").mockResolvedValue(undefined);

    render(<OfflineSyncListener />);
    expect(syncSpy).not.toHaveBeenCalled();

    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it("no renderiza nada visible", () => {
    vi.stubGlobal("navigator", { onLine: true });
    vi.spyOn(workoutLogSyncStatus, "runWorkoutLogSync").mockResolvedValue(undefined);

    const { container } = render(<OfflineSyncListener />);

    expect(container).toBeEmptyDOMElement();
  });
});
