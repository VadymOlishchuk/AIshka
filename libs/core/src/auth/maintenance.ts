import { db } from "../db";

/**
 * Таблиці auth ростуть з кожним входом і кожною невдалою спробою, а самі
 * себе не чистять. Відкликані сесії тримаємо тиждень: якщо вкрадений
 * refresh спливе пізніше, він і так упреться в «немає такого» -> 401.
 */
export async function cleanupAuthTables() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [sessions, tokens, limits] = await Promise.all([
    db.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: weekAgo } }] },
    }),
    db.passwordToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
    db.rateLimit.deleteMany({
      where: { resetAt: { lt: now }, OR: [{ blockedUntil: null }, { blockedUntil: { lt: now } }] },
    }),
  ]);

  return { sessions: sessions.count, tokens: tokens.count, limits: limits.count };
}
