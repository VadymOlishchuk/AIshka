import { NextResponse } from "next/server";

export type ErrorCode =
  | "unauthenticated"
  | "subscription_required"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "rate_limited"
  | "conflict"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
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

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true as const, data }, { status: 200, ...init });
}

export function fail(
  code: ErrorCode,
  options?: {
    message?: string;
    fields?: Record<string, string>;
    headers?: Record<string, string>;
  },
) {
  return NextResponse.json(
    {
      ok: false as const,
      error: {
        code,
        message: options?.message ?? DEFAULT_MESSAGE[code],
        ...(options?.fields ? { fields: options.fields } : {}),
      },
    },
    { status: STATUS[code], headers: options?.headers },
  );
}

/** Помилка домену, яку обробники перетворюють на відповідь. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message ?? DEFAULT_MESSAGE[code]);
  }
}

export function toResponse(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.code, { message: error.message, fields: error.fields });
  }
  console.error("[unhandled]", error);
  return fail("internal");
}
