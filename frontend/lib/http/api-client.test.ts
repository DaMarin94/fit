import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, isNetworkError } from "./api-client";
import { clearToasts, subscribeToasts } from "../toast/toast-store";

function jsonResponse(body: unknown, init?: { status?: number }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let toasts: Array<{ message: string }>;
  let unsubscribe: () => void;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    clearToasts();
    toasts = [];
    unsubscribe = subscribeToasts((all) => {
      toasts = all.map((t) => ({ message: t.message }));
    });
  });

  afterEach(() => {
    unsubscribe();
    vi.unstubAllGlobals();
  });

  it("en éxito con envoltorio { data }, devuelve el data desenvuelto", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: "1", name: "Fuerza" } }));

    const result = await apiFetch<{ id: string; name: string }>("/exercises/1");

    expect(result).toEqual({ id: "1", name: "Fuerza" });
  });

  it("en éxito con el recurso directo (sin envoltorio), lo devuelve tal cual", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "1", name: "Fuerza" }));

    const result = await apiFetch<{ id: string; name: string }>("/exercises/1");

    expect(result).toEqual({ id: "1", name: "Fuerza" });
  });

  it("si la respuesta trae { error }, dispara el toast con ese mensaje y tira ApiError con su code", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { message: "Ya existe un ejercicio con ese nombre.", code: "NAME_TAKEN" } },
        { status: 409 },
      ),
    );

    await expect(apiFetch("/exercises")).rejects.toMatchObject({
      message: "Ya existe un ejercicio con ese nombre.",
      code: "NAME_TAKEN",
    });

    expect(toasts).toEqual([{ message: "Ya existe un ejercicio con ese nombre." }]);
  });

  it("tira ApiError instanciado (no un objeto plano)", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "Error.", code: "X" } }, { status: 400 }),
    );

    await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("si la respuesta no es ok y no trae cuerpo interpretable, dispara un toast genérico", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));

    await expect(apiFetch("/x")).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toMatch(/error inesperado/i);
  });

  it("si fetch rechaza (sin red), dispara toast de red y tira ApiError NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiFetch("/x")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toMatch(/conexión/i);
  });

  it("serializa un body objeto como JSON y setea el content-type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    await apiFetch("/exercises", { method: "POST", body: { name: "Sentadillas" } });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "Sentadillas" }));
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("no dispara toast cuando la respuesta es exitosa", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    await apiFetch("/x");

    expect(toasts).toHaveLength(0);
  });

  it("con silent: true, un error de red no dispara toast pero sigue tirando ApiError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiFetch("/x", { silent: true })).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(toasts).toHaveLength(0);
  });

  it("con silent: true, un error del servidor no dispara toast pero sigue tirando ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "Error.", code: "X" } }, { status: 400 }),
    );

    await expect(apiFetch("/x", { silent: true })).rejects.toMatchObject({ code: "X" });
    expect(toasts).toHaveLength(0);
  });
});

describe("isNetworkError", () => {
  it("es true para un ApiError con code NETWORK_ERROR", () => {
    expect(isNetworkError(new ApiError("x", "NETWORK_ERROR"))).toBe(true);
  });

  it("es false para un ApiError con otro code", () => {
    expect(isNetworkError(new ApiError("x", "NAME_TAKEN"))).toBe(false);
  });

  it("es false para un error que no es ApiError", () => {
    expect(isNetworkError(new Error("x"))).toBe(false);
    expect(isNetworkError("x")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
