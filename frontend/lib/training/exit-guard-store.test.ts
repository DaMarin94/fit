import { afterEach, describe, expect, it, vi } from "vitest";
import { clearExitGuard, getExitGuard, requestGuardedNavigation, setExitGuard } from "./exit-guard-store";

describe("exit-guard-store", () => {
  afterEach(() => {
    clearExitGuard();
  });

  it("sin guardia activa, getExitGuard es null", () => {
    expect(getExitGuard()).toBeNull();
  });

  it("con guardia activa, requestGuardedNavigation la invoca y devuelve true (navegación interceptada)", () => {
    const guard = vi.fn();
    setExitGuard(guard);

    const intercepted = requestGuardedNavigation("/pool");

    expect(intercepted).toBe(true);
    expect(guard).toHaveBeenCalledWith("/pool");
  });

  it("sin guardia, requestGuardedNavigation devuelve false (no intercepta)", () => {
    const intercepted = requestGuardedNavigation("/pool");
    expect(intercepted).toBe(false);
  });

  it("clearExitGuard saca la guardia activa", () => {
    setExitGuard(vi.fn());
    clearExitGuard();
    expect(getExitGuard()).toBeNull();
  });
});
