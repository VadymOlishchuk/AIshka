import { randomBytes } from "node:crypto";
import { db } from "../db";
import { env } from "../env";
import { AppError } from "../http/errors";
import { sendMail } from "../mail/send";
import { hashPassword } from "./password";
import { revokeAllSessions } from "./session";
import { hashToken } from "./tokens";

const TTL = { reset: 30 * 60 * 1000, set: 7 * 24 * 60 * 60 * 1000 } as const;

export type TokenPurpose = keyof typeof TTL;

/**
 * Один механізм на три сценарії: перше встановлення пароля, забутий пароль
 * і зміна пароля. Різниця лише в тексті листа й терміні життя токена.
 */
export async function issuePasswordToken(email: string, purpose: TokenPurpose): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, firstName: true } });

  // Відповідь однакова незалежно від того, чи існує акаунт — інакше форма
  // «забули пароль» стає способом перевіряти, хто у нас зареєстрований.
  // Сирий токен повертається лише тому, хто його щойно оплатив; форма
  // «забув пароль» його ніколи не показує.
  if (!user) return null;

  const raw = randomBytes(32).toString("base64url");

  await db.passwordToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      purpose,
      expiresAt: new Date(Date.now() + TTL[purpose]),
    },
  });

  const link = `${env.APP_URL}/set-password?token=${raw}`;

  await sendMail({
    to: email,
    subject: purpose === "reset" ? "Reset your password" : "Set your password",
    body:
      purpose === "reset"
        ? `Hi ${user.firstName}, open this link to choose a new password (valid for 30 minutes): ${link}`
        : `Hi ${user.firstName}, open this link to set your password: ${link}`,
  });

  return raw;
}

export async function consumePasswordToken(raw: string, newPassword: string) {
  const token = await db.passwordToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });

  if (!token || token.usedAt || token.expiresAt < new Date()) {
    throw new AppError("validation_failed", "This link has expired. Request a new one.");
  }

  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    db.passwordToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);

  // Зміна пароля закриває всі сесії: якщо доступ був у когось іншого, він втрачається.
  await revokeAllSessions(token.userId);

  return token.userId;
}
