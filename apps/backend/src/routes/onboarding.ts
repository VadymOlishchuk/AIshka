import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "@aishka/core/db";
import {
  COMPLETED,
  STEPS,
  getStep,
  nextStepSlug,
  normalizeAnswer,
} from "@aishka/core/plan/onboarding";
import { assignPlan, readAnswers } from "@aishka/core/plan/enroll";
import { explainFirstUnit } from "@aishka/core/plan/rules";
import { requireUserOf } from "../lib/auth";

const Input = z.object({
  step: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
});

export const onboardingRoutes: FastifyPluginAsync = async (app) => {
  /** Уся конфігурація кроків і стан людини за один запит — сторінка кроку більше нічого не питає. */
  app.get("/", async (req, reply) => {
    const user = await requireUserOf(req);
    const answers = await readAnswers(user.id);
    return reply.ok({
      steps: STEPS,
      current: user.onboardingStep,
      done: user.onboardingDone || user.onboardingStep === COMPLETED,
      answers,
    });
  });

  app.post("/", async (req, reply) => {
    const user = await requireUserOf(req);

    const parsed = Input.safeParse(req.body);
    if (!parsed.success) return reply.fail("validation_failed");

    const step = getStep(parsed.data.step);
    if (!step) return reply.fail("not_found");

    const value = normalizeAnswer(step, parsed.data.value);
    if (value === null) {
      return reply.fail("validation_failed", { message: "Pick at least one option to continue." });
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
      return reply.ok({ next: "/onboarding/ready" });
    }
    return reply.ok({ next: `/onboarding/${next}` });
  });

  /** Екран «план готовий»: курс, перші юніти й чому саме так. */
  app.get("/ready", async (req, reply) => {
    const user = await requireUserOf(req);

    const enrollment = await db.enrollment.findFirst({
      where: { userId: user.id, isPrimary: true },
      include: {
        course: { include: { modules: { include: { _count: { select: { lessons: true } } } } } },
      },
    });
    if (!enrollment) return reply.fail("not_found");

    const bySlug = new Map(enrollment.course.modules.map((m) => [m.slug, m]));
    const units = enrollment.moduleOrder
      .map((slug) => bySlug.get(slug))
      .filter((m) => m !== undefined);
    const lessons = units.reduce((n, m) => n + m._count.lessons, 0);

    const answers = await readAnswers(user.id);

    return reply.ok({
      courseTitle: enrollment.course.title,
      units: units.map((u) => ({ id: u.id, slug: u.slug, title: u.title, icon: u.icon })),
      lessons,
      minutes: lessons * 6,
      why: explainFirstUnit(answers),
    });
  });
};
