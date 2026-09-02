import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "@aishka/core/db";
import { getDummyHash, hashPassword, verifyPassword } from "@aishka/core/auth/password";
import { rateLimit, resetRateLimit } from "@aishka/core/auth/rate-limit";
import {
  LoginInput,
  RegisterInput,
  emailField,
  fieldErrors,
  passwordField,
} from "@aishka/core/auth/schemas";
import { issueSessionPair, revokeByRefresh, rotateSession } from "@aishka/core/auth/session";
import { consumePasswordToken, issuePasswordToken } from "@aishka/core/auth/password-reset";
import { FIRST_STEP } from "@aishka/core/plan/onboarding";
import {
  clearAuthCookies,
  refreshToken,
  requestCtx,
  requestIp,
  setAuthCookies,
} from "../lib/auth";

const landing = (user: { onboardingDone: boolean }) =>
  user.onboardingDone ? "/dashboard" : "/onboarding";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (req, reply) => {
    const parsed = RegisterInput.safeParse(req.body);
    if (!parsed.success) {
      return reply.fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    const gate = await rateLimit([`register:ip:${requestIp(req)}`], { limit: 5, windowSec: 3600 });
    if (!gate.allowed) {
      return reply.fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    const { firstName, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // TODO(етап 3): коли з'явиться розсилка — не розкривати зайнятість пошти,
      // а надсилати лист «у вас уже є акаунт» і показувати той самий екран.
      return reply.fail("validation_failed", {
        fields: { email: "This email already has an account. Sign in instead." },
      });
    }

    const user = await db.user.create({
      data: {
        email,
        firstName,
        passwordHash: await hashPassword(password),
        onboardingStep: FIRST_STEP,
      },
    });

    const { access, refresh } = await issueSessionPair(user.id, requestCtx(req));
    return setAuthCookies(reply, access, refresh).ok({ next: "/onboarding" });
  });

  app.post("/login", async (req, reply) => {
    const parsed = LoginInput.safeParse(req.body);
    if (!parsed.success) {
      return reply.fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }
    const { email, password } = parsed.data;

    // Лімітуємо і за IP, і за акаунтом: інакше перебір просто
    // розкладається по багатьох адресах або по багатьох акаунтах.
    const keys = [`login:ip:${requestIp(req)}`, `login:acc:${email}`];
    const gate = await rateLimit(keys, { limit: 5, windowSec: 60, blockAfter: 15, blockSec: 900 });
    if (!gate.allowed) {
      return reply.fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    const user = await db.user.findUnique({ where: { email } });
    const passwordOk = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);

    // Однакова відповідь на «немає такого акаунта» і «невірний пароль»:
    // різниця повідомлень дозволяє перевіряти, хто у нас зареєстрований.
    if (!user || !passwordOk) {
      return reply.fail("unauthenticated", { message: "Wrong email or password." });
    }

    await resetRateLimit(keys);
    const { access, refresh } = await issueSessionPair(user.id, requestCtx(req));
    return setAuthCookies(reply, access, refresh).ok({ next: landing(user) });
  });

  app.post("/logout", async (req, reply) => {
    const refresh = refreshToken(req);
    if (refresh) await revokeByRefresh(refresh);
    return clearAuthCookies(reply).ok({ next: "/login" });
  });

  /** Клієнт кличе це, отримавши 401, і повторює запит. Ротація з виявленням повторного використання. */
  app.post("/refresh", async (req, reply) => {
    const refresh = refreshToken(req);
    if (!refresh) return clearAuthCookies(reply).fail("unauthenticated");

    try {
      const rotated = await rotateSession(refresh, requestCtx(req));
      return setAuthCookies(reply, rotated.access, rotated.refresh).ok({ refreshed: true });
    } catch (error) {
      clearAuthCookies(reply);
      throw error;
    }
  });

  app.post("/password/forgot", async (req, reply) => {
    const parsed = z.object({ email: emailField }).safeParse(req.body);
    if (!parsed.success) {
      return reply.fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    const gate = await rateLimit(
      [`forgot:ip:${requestIp(req)}`, `forgot:acc:${parsed.data.email}`],
      { limit: 3, windowSec: 3600 },
    );
    if (!gate.allowed) {
      return reply.fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    await issuePasswordToken(parsed.data.email, "reset");
    // Завжди 200 з тим самим текстом, існує акаунт чи ні.
    return reply.ok({ sent: true });
  });

  app.post("/password/set", async (req, reply) => {
    const parsed = z
      .object({ token: z.string().min(10), password: passwordField })
      .safeParse(req.body);
    if (!parsed.success) {
      return reply.fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    const userId = await consumePasswordToken(parsed.data.token, parsed.data.password);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    // Одразу впускаємо: змусити людину ще раз вводити щойно створений пароль — зайвий крок.
    const { access, refresh } = await issueSessionPair(user.id, requestCtx(req));
    return setAuthCookies(reply, access, refresh).ok({ next: landing(user) });
  });
};
