/** Заголовки як їх віддає Node: ключі в нижньому регістрі, значення — рядок або масив. */
export type IncomingHeaders = Record<string, string | string[] | undefined>;

function header(headers: IncomingHeaders, name: string): string | null {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Контекст запиту для сесій і лімітів. IP сюди приходить уже вирішеним
 * сервером (у Fastify — req.ip з урахуванням trustProxy). Домен навмисно
 * не читає X-Forwarded-For сам: заголовок підставляє будь-хто, і кожен, хто
 * розбирає його «на всякий випадок», дарує обхід лімітів за IP.
 */
export function ctxOf(ip: string, headers: IncomingHeaders) {
  return { ip, userAgent: header(headers, "user-agent") };
}

/** Дозволяємо редірект лише на власні відносні шляхи — інакше open redirect. */
export function safeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
