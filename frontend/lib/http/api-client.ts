import { showToast } from "../toast/toast-store";

/**
 * Capa centralizada de llamadas HTTP (`docs/technical.md` §2.2).
 * Único punto por el que salen los requests: ningún componente llama
 * `fetch` directo. Entiende el envoltorio de `docs/data-model.md` §4.1 y
 * dispara un toast en cualquier error, para que los componentes no repitan
 * manejo de error genérico. El manejo específico (ej. marcar un campo a
 * partir de un `code`) queda en manos del componente, sobre el `ApiError`
 * que esta capa deja pasar.
 */

const GENERIC_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Probá de nuevo.";
const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.";

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

type ApiErrorBody = { error: { message: string; code: string } };

function isErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return false;
  }
  const error = (body as { error: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "code" in error
  );
}

function unwrap<T>(body: unknown): T {
  if (typeof body === "object" && body !== null && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function isPlainJsonBody(body: unknown): body is Record<string, unknown> | unknown[] {
  return (
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  );
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: RequestInit["body"] | Record<string, unknown> | unknown[];
};

function fail(message: string, code: string): never {
  showToast({ message });
  throw new ApiError(message, code);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const requestInit: RequestInit = { ...rest, headers: { ...headers } };

  if (isPlainJsonBody(body)) {
    requestInit.body = JSON.stringify(body);
    requestInit.headers = {
      "Content-Type": "application/json",
      ...requestInit.headers,
    };
  } else if (body !== undefined) {
    requestInit.body = body as RequestInit["body"];
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), requestInit);
  } catch {
    return fail(NETWORK_ERROR_MESSAGE, "NETWORK_ERROR");
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (isErrorBody(parsed)) {
    return fail(parsed.error.message, parsed.error.code);
  }

  if (!response.ok) {
    return fail(GENERIC_ERROR_MESSAGE, "UNKNOWN_ERROR");
  }

  return unwrap<T>(parsed);
}
