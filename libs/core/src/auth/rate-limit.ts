import { db } from "../db";

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

type Row = { count: number; resetAt: Date; blockedUntil: Date | null };

/**
 * Перевіряє всі ключі одразу: вхід лімітується і за IP, і за акаунтом,
 * інакше перебір паролів просто розкладається по багатьох адресах.
 *
 * Лічильник оновлюється одним UPSERT-ом: read-then-write двома запитами
 * пропускав пачку паралельних спроб повз ліміт.
 */
export async function rateLimit(
  keys: string[],
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const blockAfter = options.blockAfter ?? 0;
  const blockSec = options.blockSec ?? 0;
  const now = new Date();
  let worst = 0;

  for (const key of keys) {
    const [row] = await db.$queryRaw<Row[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${options.windowSec}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= now() THEN now() + make_interval(secs => ${options.windowSec})
          ELSE "RateLimit"."resetAt" END,
        "blockedUntil" = CASE
          WHEN "RateLimit"."blockedUntil" IS NOT NULL AND "RateLimit"."blockedUntil" > now()
            THEN "RateLimit"."blockedUntil"
          WHEN ${blockAfter}::int > 0
            AND (CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END) >= ${blockAfter}::int
            THEN now() + make_interval(secs => ${blockSec})
          ELSE NULL END
      RETURNING "count", "resetAt", "blockedUntil"`;

    if (!row) continue;
    if (row.blockedUntil && row.blockedUntil > now) {
      worst = Math.max(worst, secondsUntil(row.blockedUntil, now));
    } else if (row.count > options.limit) {
      worst = Math.max(worst, secondsUntil(row.resetAt, now));
    }
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
