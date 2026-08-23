import type { NextRequest } from "next/server";

export function ipOf(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function ctxOf(req: NextRequest | Request) {
  return { ip: ipOf(req), userAgent: req.headers.get("user-agent") };
}

/** Дозволяємо редірект лише на власні відносні шляхи — інакше open redirect. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
