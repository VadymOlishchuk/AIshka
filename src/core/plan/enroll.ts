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

/**
 * Оновлює плани після появи нового контенту.
 *
 * Юніти, які людина вже почала, лишаються на своїх місцях у тому самому порядку —
 * переставляти курс під ногами того, хто вже вчиться, неприпустимо. Нові юніти,
 * на які людина заслуговує за своїми відповідями, дописуються після них.
 */
export async function refreshPlans() {
  const enrollments = await db.enrollment.findMany({
    where: { isPrimary: true },
    include: { course: { include: { modules: { include: { lessons: { select: { id: true } } } } } } },
  });

  let changed = 0;

  for (const enrollment of enrollments) {
    const answers = await readAnswers(enrollment.userId);
    if (Object.keys(answers).length === 0) continue;

    const available = new Set(enrollment.course.modules.map((m) => m.slug));
    const fresh = buildPlan(answers).filter((slug) => available.has(slug));

    const progress = await db.progress.findMany({
      where: { userId: enrollment.userId, courseId: enrollment.courseId },
      select: { lessonId: true },
    });
    const touched = new Set(progress.map((p) => p.lessonId));

    const startedSlugs = enrollment.course.modules
      .filter((m) => m.lessons.some((l) => touched.has(l.id)))
      .map((m) => m.slug);

    const started = enrollment.moduleOrder.filter((slug) => startedSlugs.includes(slug));
    const rest = fresh.filter((slug) => !started.includes(slug));
    const next = [...started, ...rest];

    if (next.join("|") === enrollment.moduleOrder.join("|")) continue;

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { moduleOrder: next },
    });
    changed += 1;
  }

  return changed;
}
