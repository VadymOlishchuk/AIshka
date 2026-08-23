import { db } from "@/lib/db";

export type RateLimitOptions = {
  /** Скільки спроб дозволено у вікні. */
  limit: number;
  /** Довжина вікна в секундах. */
  windowSec: number;
  /** Після скількох спроб вмикається довге блокування. */
  blockAfter?: number;
  /** Довжина довгого блокування в секундах. */
  blockSec?: number;
};

export type RateLimitResult = { allowed: boolean; retryAfter: number };

/**
 * Перевіряє всі ключі одразу: вхід лімітується і за IP, і за акаунтом,
 * інакше перебір паролів просто розкладається по багатьох адресах.
 */
export async function rateLimit(
  keys: string[],
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = new Date();
  let worst = 0;

  for (const key of keys) {
    const existing = await db.rateLimit.findUnique({ where: { key } });

    if (existing?.blockedUntil && existing.blockedUntil > now) {
      worst = Math.max(worst, secondsUntil(existing.blockedUntil, now));
      continue;
    }

    const windowExpired = !existing || existing.resetAt <= now;
    const count = windowExpired ? 1 : existing.count + 1;
    const resetAt = windowExpired
      ? new Date(now.getTime() + options.windowSec * 1000)
      : existing.resetAt;

    const shouldBlock =
      options.blockAfter !== undefined &&
      options.blockSec !== undefined &&
      count >= options.blockAfter;

    await db.rateLimit.upsert({
      where: { key },
      create: { key, count, resetAt },
      update: {
        count,
        resetAt,
        ...(shouldBlock
          ? { blockedUntil: new Date(now.getTime() + options.blockSec! * 1000) }
          : {}),
      },
    });

    if (shouldBlock) worst = Math.max(worst, options.blockSec!);
    else if (count > options.limit) worst = Math.max(worst, secondsUntil(resetAt, now));
  }

  return worst > 0 ? { allowed: false, retryAfter: worst } : { allowed: true, retryAfter: 0 };
}

/** Скидає лічильники після успішної дії — інакше вдалий вхід усе одно веде до блокування. */
export async function resetRateLimit(keys: string[]) {
  await db.rateLimit.deleteMany({ where: { key: { in: keys } } });
}

function secondsUntil(date: Date, now: Date) {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));
}
