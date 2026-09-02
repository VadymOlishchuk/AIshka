/**
 * Помилки домену й формат відповіді API. Тут немає жодного фреймворку:
 * обробник (Fastify, скрипт, що завгодно) сам вирішує, як віддати
 * status/body, а домен лише каже, що сталося.
 *
 * Формат відповіді — { ok:true, data } / { ok:false, error:{ code, message, fields? } }.
 * Клієнт ніколи не парсить текст повідомлення, тільки code.
 */
export type ErrorCode =
  | "unauthenticated"
  | "subscription_required"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "rate_limited"
  | "conflict"
  | "internal";

export const STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  subscription_required: 402,
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
  rate_limited: 429,
  conflict: 409,
  internal: 500,
};

const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  unauthenticated: "Please sign in to continue.",
  subscription_required: "This needs an active subscription.",
  forbidden: "You don't have access to this.",
  not_found: "Not found.",
  validation_failed: "Please check the highlighted fields.",
  rate_limited: "Too many attempts. Try again in a moment.",
  conflict: "This has already been done.",
  internal: "Something went wrong on our side. Please try again.",
};

export type ErrorBody = {
  ok: false;
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
};

export type OkBody<T> = { ok: true; data: T };

export function okBody<T>(data: T): OkBody<T> {
  return { ok: true, data };
}

export function errorBody(
  code: ErrorCode,
  options?: { message?: string; fields?: Record<string, string> },
): ErrorBody {
  return {
    ok: false,
    error: {
      code,
      message: options?.message ?? DEFAULT_MESSAGE[code],
      ...(options?.fields ? { fields: options.fields } : {}),
    },
  };
}

/** Помилка домену, яку обробники перетворюють на відповідь. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly fields?: Record<string, string>,
    readonly headers?: Record<string, string>,
  ) {
    super(message ?? DEFAULT_MESSAGE[code]);
  }
}
