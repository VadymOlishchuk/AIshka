import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { ctxOf, ipOf } from "@/core/http/request";
import { setAuthCookies } from "@/core/auth/cookies";
import { hashPassword } from "@/core/auth/password";
import { rateLimit } from "@/core/auth/rate-limit";
import { fieldErrors, RegisterInput } from "@/core/auth/schemas";
import { issueSessionPair } from "@/core/auth/session";
import { FIRST_STEP } from "@/core/plan/onboarding";

export async function POST(req: NextRequest) {
  try {
    const parsed = RegisterInput.safeParse(await req.json());
    if (!parsed.success) {
      return fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    const gate = await rateLimit([`register:ip:${ipOf(req)}`], {
      limit: 5,
      windowSec: 3600,
    });
    if (!gate.allowed) {
      return fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    const { firstName, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // TODO(етап 3): коли з'явиться розсилка — не розкривати зайнятість пошти,
      // а надсилати лист «у вас уже є акаунт» і показувати той самий екран.
      return fail("validation_failed", {
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

    const { access, refresh } = await issueSessionPair(user.id, ctxOf(req));
    return setAuthCookies(ok({ next: "/onboarding" }), access, refresh);
  } catch (error) {
    return toResponse(error);
  }
}
