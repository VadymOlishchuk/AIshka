import { db } from "../db";
import { env } from "../env";
import { AppError } from "../http/errors";
import { verifyAccess } from "./tokens";

/**
 * Хто прийшов. Приймає сирий access-токен — звідки він узятий (cookie,
 * заголовок), домен не знає й знати не має.
 */
export async function currentUser(token: string | null | undefined) {
  if (!token) return null;
  const claims = await verifyAccess(token);
  if (!claims) return null;

  const user = await db.user.findUnique({ where: { id: claims.sub } });
  if (!user) return null;

  // Сесію могли відкликати (зміна пароля, вихід з усіх пристроїв),
  // а access-токен ще живий до 15 хвилин — перевіряємо явно.
  const session = await db.session.findUnique({ where: { id: claims.sid } });
  if (!session || session.revokedAt) return null;

  return user;
}

export async function requireUser(token: string | null | undefined) {
  const user = await currentUser(token);
  if (!user) throw new AppError("unauthenticated");
  return user;
}

/**
 * Єдина точка, через яку проходить увесь контент уроків.
 * Етап 1: доступ мають усі зареєстровані.
 * Етап 3: вмикається BILLING_ENABLED — і більше нічого не змінюється.
 */
export async function requireActiveAccess(token: string | null | undefined) {
  const user = await requireUser(token);

  if (env.BILLING_ENABLED) {
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    const active =
      sub &&
      (sub.status === "active" || sub.status === "trialing") &&
      sub.currentPeriodEnd > new Date();

    if (!active) throw new AppError("subscription_required");
  }

  return user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
