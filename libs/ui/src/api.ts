import { redirect } from "react-router";
import type { ErrorCode } from "@aishka/core/http/errors";

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string, string> } };

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/**
 * Єдиний клієнт API. Access-токен живе 15 хвилин: на перший 401 клієнт сам
 * оновлює пару через /api/auth/refresh і повторює запит один раз. Якщо і це
 * не допомогло — сесії немає, і рішення приймає той, хто викликав.
 */
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
  });

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
    if (refreshed.ok) return request<T>(path, init, false);
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    // тіло не JSON — нижче впаде як internal
  }

  if (!body) throw new ApiError("internal", "Something went wrong on our side.", res.status);
  if (!body.ok) throw new ApiError(body.error.code, body.error.message, res.status, body.error.fields);
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
};

/**
 * Для loader-ів роутера: без сесії — на вхід із поверненням, немає ресурсу —
 * 404 у error boundary. Усе інше лишається помилкою, яку сторінка бачить сама.
 */
export async function load<T>(path: string, request: Request): Promise<T> {
  try {
    return await api.get<T>(path);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "unauthenticated") {
        const url = new URL(request.url);
        const next = encodeURIComponent(url.pathname + url.search);
        throw redirect(`/login?next=${next}`);
      }
      if (error.code === "not_found" || error.code === "forbidden") {
        throw new Response(error.message, { status: error.status });
      }
    }
    throw error;
  }
}

export type Me = {
  id: string;
  email: string;
  firstName: string;
  createdAt: string;
  onboardingDone: boolean;
  onboardingStep: string;
};

export const fetchMe = (request: Request) => load<Me>("/api/me", request);
