import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "../http/envelope";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccess } from "./tokens";

export async function readAccessClaims() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccess(token);
}

export async function currentUser() {
  const claims = await readAccessClaims();
  if (!claims) return null;

  const user = await db.user.findUnique({ where: { id: claims.sub } });
  if (!user) return null;

  // Сесію могли відкликати (зміна пароля, вихід з усіх пристроїв),
  // а access-токен ще живий до 15 хвилин — перевіряємо явно.
  const session = await db.session.findUnique({ where: { id: claims.sid } });
  if (!session || session.revokedAt) return null;

  return user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError("unauthenticated");
  return user;
}

/**
 * Єдина точка, через яку проходить увесь контент уроків.
 * Етап 1: доступ мають усі зареєстровані.
 * Етап 3: вмикається BILLING_ENABLED — і більше нічого не змінюється.
 */
export async function requireActiveAccess() {
  const user = await requireUser();

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
