import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { ctxOf } from "@/core/http/request";
import { setAuthCookies } from "@/core/auth/cookies";
import { passwordField, fieldErrors } from "@/core/auth/schemas";
import { consumePasswordToken } from "@/core/auth/password-reset";
import { issueSessionPair } from "@/core/auth/session";

const Input = z.object({ token: z.string().min(10), password: passwordField });

export async function POST(req: NextRequest) {
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return fail("validation_failed", { fields: fieldErrors(parsed.error) });

    const userId = await consumePasswordToken(parsed.data.token, parsed.data.password);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    // Одразу впускаємо: змусити людину ще раз вводити щойно створений пароль — зайвий крок.
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
