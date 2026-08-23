import { db } from "@/lib/db";
import type { Answers } from "./onboarding";
import { buildPlan, RULES } from "./rules";

export async function readAnswers(userId: string): Promise<Answers> {
  const rows = await db.onboardingAnswer.findMany({ where: { userId } });
  const answers: Answers = {};
  for (const row of rows) {
    answers[row.stepSlug] = row.value as string | string[];
  }
  return answers;
}

/**
 * Призначає персональний план. Викликається після останнього кроку онбордингу
 * і при перепроходженні з профілю — прогрес по вже пройдених уроках лишається.
 */
export async function assignPlan(userId: string) {
  const answers = await readAnswers(userId);

  const course = await db.course.findUnique({
    where: { slug: RULES.course },
    include: { modules: { select: { slug: true } } },
  });
  if (!course) throw new Error(`План «${RULES.course}» не знайдено. Спершу: pnpm content:sync`);

  const available = new Set(course.modules.map((m) => m.slug));

  // Юніти, для яких ще немає уроків, до бази не потрапляють — і в план не йдуть.
  // Краще коротший чесний план, ніж картки, що нікуди не ведуть.
  const moduleOrder = buildPlan(answers).filter((slug) => available.has(slug));

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id, moduleOrder, answers, isPrimary: true },
    update: { moduleOrder, answers },
  });

  return { course, moduleOrder };
}
