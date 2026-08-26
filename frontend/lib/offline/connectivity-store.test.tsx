import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  getIsOnline,
  resetConnectivityListeners,
  subscribeConnectivity,
  useIsOnline,
} from "./connectivity-store";

function Probe() {
  const isOnline = useIsOnline();
  return <span>{isOnline ? "online" : "offline"}</span>;
}

describe("lib/offline/connectivity-store", () => {
  afterEach(() => {
    resetConnectivityListeners();
    vi.unstubAllGlobals();
  });

  it("getIsOnline refleja navigator.onLine", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(getIsOnline()).toBe(true);

    vi.stubGlobal("navigator", { onLine: false });
    expect(getIsOnline()).toBe(false);
  });

  it("notifica a los suscriptores en los eventos online/offline de window", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConnectivity(listener);

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("dejar de suscribirse corta las notificaciones", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConnectivity(listener);
    unsubscribe();

    window.dispatchEvent(new Event("offline"));

    expect(listener).not.toHaveBeenCalled();
  });

  it("useIsOnline arranca reflejando el estado actual y se actualiza con los eventos", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    render(<Probe />);
    expect(screen.getByText("online")).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("offline")).toBeInTheDocument();
  });
});
