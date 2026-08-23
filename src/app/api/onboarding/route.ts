import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, toResponse } from "@/core/http/envelope";
import { requireUser } from "@/core/auth/guards";
import { COMPLETED, getStep, nextStepSlug, normalizeAnswer } from "@/core/plan/onboarding";
import { assignPlan } from "@/core/plan/enroll";

const Input = z.object({
  step: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return fail("validation_failed");

    const step = getStep(parsed.data.step);
    if (!step) return fail("not_found");

    const value = normalizeAnswer(step, parsed.data.value);
    if (value === null) {
      return fail("validation_failed", { message: "Pick at least one option to continue." });
    }

    await db.onboardingAnswer.upsert({
      where: { userId_stepSlug: { userId: user.id, stepSlug: step.slug } },
      create: { userId: user.id, stepSlug: step.slug, value },
      update: { value },
    });

    const next = nextStepSlug(step.slug);
    const done = next === COMPLETED;

    await db.user.update({
      where: { id: user.id },
      data: { onboardingStep: next, onboardingDone: done },
    });

    if (done) {
      await assignPlan(user.id);
      return ok({ next: "/onboarding/ready" });
    }

    return ok({ next: `/onboarding/${next}` });
  } catch (error) {
    return toResponse(error);
  }
}
