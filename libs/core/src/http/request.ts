/** Заголовки як їх віддає Node: ключі в нижньому регістрі, значення — рядок або масив. */
export type IncomingHeaders = Record<string, string | string[] | undefined>;

function header(headers: IncomingHeaders, name: string): string | null {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function ipOf(headers: IncomingHeaders, fallback = "unknown"): string {
  const forwarded = header(headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return header(headers, "x-real-ip") ?? fallback;
}

export function ctxOf(headers: IncomingHeaders, socketIp?: string) {
  return { ip: ipOf(headers, socketIp ?? "unknown"), userAgent: header(headers, "user-agent") };
}

/** Дозволяємо редірект лише на власні відносні шляхи — інакше open redirect. */
export function safeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
