import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { AppError } from "../http/envelope";
import { hashToken, newOpaqueToken, signAccess, REFRESH_TTL_SECONDS } from "./tokens";

export type RequestCtx = { ip?: string | null; userAgent?: string | null };

export async function issueSessionPair(
  userId: string,
  ctx: RequestCtx,
  familyId: string = randomUUID(),
) {
  const refresh = newOpaqueToken();
  const session = await db.session.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(refresh),
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    },
  });

  const access = await signAccess({ sub: userId, sid: session.id });
  return { access, refresh, session };
}

/**
 * Ротація: кожне використання refresh-токена видає новий і закриває старий.
 * Якщо приходить токен, який уже був замінений, — його копію має хтось інший,
 * тому відкликаємо всю родину сесій.
 */
export async function rotateSession(rawRefresh: string, ctx: RequestCtx) {
  const current = await db.session.findUnique({
    where: { tokenHash: hashToken(rawRefresh) },
  });

  if (!current || current.expiresAt < new Date()) {
    throw new AppError("unauthenticated");
  }

  if (current.revokedAt || current.replacedById) {
    await db.session.updateMany({
      where: { familyId: current.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    console.warn("[auth] refresh_reuse_detected", {
      userId: current.userId,
      familyId: current.familyId,
    });
    throw new AppError("unauthenticated");
  }

  const next = await issueSessionPair(current.userId, ctx, current.familyId);
  await db.session.update({
    where: { id: current.id },
    data: { revokedAt: new Date(), replacedById: next.session.id },
  });

  return next;
}

export async function revokeByRefresh(rawRefresh: string) {
  await db.session.updateMany({
    where: { tokenHash: hashToken(rawRefresh), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Використовується після зміни пароля. */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}
