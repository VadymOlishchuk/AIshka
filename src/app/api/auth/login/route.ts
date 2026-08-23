import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { ctxOf, ipOf } from "@/core/http/request";
import { setAuthCookies } from "@/core/auth/cookies";
import { getDummyHash, verifyPassword } from "@/core/auth/password";
import { rateLimit, resetRateLimit } from "@/core/auth/rate-limit";
import { fieldErrors, LoginInput } from "@/core/auth/schemas";
import { issueSessionPair } from "@/core/auth/session";

export async function POST(req: NextRequest) {
  try {
    const parsed = LoginInput.safeParse(await req.json());
    if (!parsed.success) {
      return fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    const { email, password } = parsed.data;

    // Лімітуємо і за IP, і за акаунтом: інакше перебір просто
    // розкладається по багатьох адресах або по багатьох акаунтах.
    const keys = [`login:ip:${ipOf(req)}`, `login:acc:${email}`];
    const gate = await rateLimit(keys, {
      limit: 5,
      windowSec: 60,
      blockAfter: 15,
      blockSec: 900,
    });
    if (!gate.allowed) {
      return fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    const user = await db.user.findUnique({ where: { email } });
    const passwordOk = await verifyPassword(
      user?.passwordHash ?? (await getDummyHash()),
      password,
    );

    // Однакова відповідь на «немає такого акаунта» і «невірний пароль»:
    // різниця повідомлень дозволяє перевіряти, хто у нас зареєстрований.
    if (!user || !passwordOk) {
      return fail("unauthenticated", { message: "Wrong email or password." });
    }

    await resetRateLimit(keys);
    const { access, refresh } = await issueSessionPair(user.id, ctxOf(req));

    return setAuthCookies(
      ok({ next: user.onboardingDone ? "/dashboard" : "/onboarding" }),
      access,
      refresh,
    );
  } catch (error) {
    return toResponse(error);
  }
}
