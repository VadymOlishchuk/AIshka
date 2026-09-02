import { db } from "../db";
import { Block } from "../content/blocks";

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
  icon: string | null;
  lessons: PlanLesson[];
  completed: number;
  total: number;
  locked: boolean;
};

export type UserPlan = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coverUrl: string | null;
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
      icon: module.icon,
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
    coverUrl: enrollment.course.coverUrl,
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
    include: { module: { include: { course: { include: { _count: { select: { modules: true } } } } } } },
  });
  if (!lesson || !lesson.isPublished) return null;

  // У курсах з одного юніта назва юніта нічого не додає («The Course»),
  // тому в шапці уроку показуємо назву курсу.
  const eyebrow =
    lesson.module.course._count.modules === 1 ? lesson.module.course.title : lesson.module.title;

  const blocks = Block.array().parse(lesson.blocks);
  const courseId = lesson.module.courseId;

  const plan = await getUserPlan(userId);
  const inPlan = plan?.courseId === courseId ? plan : null;

  let locked = false;
  let nextLessonSlug: string | null = null;

  // Урок, на який посилається слот збірки, ніколи не замкнений. Збірка —
  // головна структура, і теорія в ній доставляється в момент затику, а не
  // після того, як пройдено все попереднє. Послідовний гейт плану тут
  // означав би «спершу вчишся, потім робиш» — саме те, від чого йдемо.
  const isSlotLesson =
    (await db.slot.count({ where: { lessonId: lesson.id } })) > 0;

  if (inPlan && !isSlotLesson) {
    // Персональний план — послідовний: урок відкривається після попереднього.
    const flat = inPlan.units.flatMap((u) => u.lessons);
    const index = flat.findIndex((l) => l.id === lesson.id);
    locked = index >= 0 ? flat[index]!.locked : false;
    nextLessonSlug = index >= 0 ? (flat[index + 1]?.slug ?? null) : null;
  } else {
    // Academy — вільний доступ: будь-який урок відкритий одразу.
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: { lessons: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    const flat = course?.modules.flatMap((m) => m.lessons) ?? [];
    const index = flat.findIndex((l) => l.id === lesson.id);
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
      unitTitle: eyebrow,
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

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  icon: string | null;
  coverUrl: string | null;
  shelf: string | null;
  lessons: number;
  minutes: number;
  completed: number;
};

/**
 * Academy — бібліотека за потребою, а не програма: доступ вільний,
 * прогрес рахується окремо для кожного курсу.
 */
export async function getAcademyCatalog(userId: string): Promise<CatalogCourse[]> {
  const courses = await db.course.findMany({
    where: { isPublished: true, kind: { not: "plan" } },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      modules: { include: { lessons: { where: { isPublished: true }, select: { durationMin: true } } } },
    },
  });

  const done = await db.progress.groupBy({
    by: ["courseId"],
    where: { userId },
    _count: { _all: true },
  });
  const completedByCourse = new Map(done.map((d) => [d.courseId, d._count._all]));

  return courses.map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      kind: course.kind,
      icon: course.icon,
      coverUrl: course.coverUrl,
      shelf: course.shelf,
      lessons: lessons.length,
      minutes: lessons.reduce((n, l) => n + l.durationMin, 0),
      completed: completedByCourse.get(course.id) ?? 0,
    };
  });
}

export type CourseView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  icon: string | null;
  units: {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    lessons: PlanLesson[];
  }[];
  totalLessons: number;
  completedLessons: number;
  nextLessonSlug: string | null;
};

export async function getCourseForUser(userId: string, slug: string): Promise<CourseView | null> {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!course || !course.isPublished) return null;

  const done = await db.progress.findMany({
    where: { userId, courseId: course.id },
    select: { lessonId: true },
  });
  const completedIds = new Set(done.map((p) => p.lessonId));

  let nextLessonSlug: string | null = null;
  let totalLessons = 0;
  let completedLessons = 0;

  const units = course.modules
    .filter((m) => m.lessons.length > 0)
    .map((module) => ({
      id: module.id,
      slug: module.slug,
      title: module.title,
      description: module.description,
      icon: module.icon,
      lessons: module.lessons.map((lesson) => {
        const completed = completedIds.has(lesson.id);
        totalLessons += 1;
        if (completed) completedLessons += 1;
        else nextLessonSlug ??= lesson.slug;

        // Academy не блокує нічого: locked завжди false.
        return toPlanLesson(lesson, completed, false);
      }),
    }));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    kind: course.kind,
    icon: course.icon,
    units,
    totalLessons,
    completedLessons,
    nextLessonSlug,
  };
}
