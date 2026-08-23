import { db } from "@/lib/db";
import { Block } from "@/core/content/blocks";

export type PlanLesson = {
  id: string;
  slug: string;
  title: string;
  durationMin: number;
  completed: boolean;
  locked: boolean;
};

export type PlanUnit = {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessons: PlanLesson[];
  completed: number;
  total: number;
  locked: boolean;
};

export type UserPlan = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseDescription: string;
  units: PlanUnit[];
  totalLessons: number;
  completedLessons: number;
  percent: number;
  nextLesson: PlanLesson | null;
};

/**
 * Персональний план у порядку, який зібрали правила онбордингу.
 * Доступ послідовний: урок n відкривається після n−1, юніт — після попереднього.
 */
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const enrollment = await db.enrollment.findFirst({
    where: { userId, isPrimary: true },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
  if (!enrollment) return null;

  const done = await db.progress.findMany({
    where: { userId, courseId: enrollment.courseId },
    select: { lessonId: true },
  });
  const completedIds = new Set(done.map((p) => p.lessonId));

  const bySlug = new Map(enrollment.course.modules.map((m) => [m.slug, m]));

  let unlockedSoFar = true;
  let nextLesson: PlanLesson | null = null;
  let totalLessons = 0;
  let completedLessons = 0;

  const units: PlanUnit[] = [];

  for (const slug of enrollment.moduleOrder) {
    const module = bySlug.get(slug);
    if (!module || module.lessons.length === 0) continue;

    const unitLocked = !unlockedSoFar;
    const lessons: PlanLesson[] = [];
    let unitCompleted = 0;

    for (const lesson of module.lessons) {
      const completed = completedIds.has(lesson.id);
      const locked = !unlockedSoFar;

      if (completed) {
        unitCompleted += 1;
        completedLessons += 1;
      } else if (unlockedSoFar) {
        // Перший незавершений урок — це і є «продовжити навчання».
        nextLesson ??= { ...toPlanLesson(lesson, completed, locked) };
        unlockedSoFar = false;
      }

      totalLessons += 1;
      lessons.push(toPlanLesson(lesson, completed, locked));
    }

    units.push({
      id: module.id,
      slug: module.slug,
      title: module.title,
      description: module.description,
      lessons,
      completed: unitCompleted,
      total: module.lessons.length,
      locked: unitLocked,
    });
  }

  return {
    courseId: enrollment.courseId,
    courseSlug: enrollment.course.slug,
    courseTitle: enrollment.course.title,
    courseDescription: enrollment.course.description,
    units,
    totalLessons,
    completedLessons,
    // Відсоток рахуємо лише за наявності знаменника — інакше на екрані NaN%.
    percent: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
    nextLesson,
  };
}

function toPlanLesson(
  lesson: { id: string; slug: string; title: string; durationMin: number },
  completed: boolean,
  locked: boolean,
): PlanLesson {
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    durationMin: lesson.durationMin,
    completed,
    locked: locked && !completed,
  };
}

export type LessonView = {
  id: string;
  slug: string;
  title: string;
  durationMin: number;
  blocks: Block[];
  courseId: string;
  courseSlug: string;
  unitTitle: string;
  completed: boolean;
  nextLessonSlug: string | null;
};

/** Урок разом із контекстом доступу. Блоки віддаються лише після перевірки. */
export async function getLessonForUser(
  userId: string,
  slug: string,
): Promise<{ lesson: LessonView; locked: boolean } | null> {
  const lesson = await db.lesson.findUnique({
    where: { slug },
    include: { module: { include: { course: true } } },
  });
  if (!lesson || !lesson.isPublished) return null;

  const blocks = Block.array().parse(lesson.blocks);
  const courseId = lesson.module.courseId;

  const plan = await getUserPlan(userId);
  const inPlan = plan?.courseId === courseId ? plan : null;

  let locked = false;
  let nextLessonSlug: string | null = null;

  if (inPlan) {
    const flat = inPlan.units.flatMap((u) => u.lessons);
    const index = flat.findIndex((l) => l.id === lesson.id);
    locked = index >= 0 ? flat[index]!.locked : false;
    nextLessonSlug = index >= 0 ? (flat[index + 1]?.slug ?? null) : null;
  }

  const completed = await db.progress.findUnique({
    where: { userId_lessonId_courseId: { userId, lessonId: lesson.id, courseId } },
    select: { id: true },
  });

  return {
    locked,
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      durationMin: lesson.durationMin,
      blocks,
      courseId,
      courseSlug: lesson.module.course.slug,
      unitTitle: lesson.module.title,
      completed: Boolean(completed),
      nextLessonSlug,
    },
  };
}

/** Ідемпотентно: подвійний клік по «Finish Lesson» — звичайна річ на телефоні. */
export async function completeLesson(userId: string, lessonId: string, courseId: string) {
  await db.progress.upsert({
    where: { userId_lessonId_courseId: { userId, lessonId, courseId } },
    create: { userId, lessonId, courseId },
    update: {},
  });
}
