import { db } from "../db";

/**
 * ЗБІРКА. Прогрес тут — не число, а перелік слотів: заповнені й порожні.
 * Сервіс навмисно не віддає жодного відсотка. Якщо він десь знадобиться —
 * це знак, що інтерфейс з'їхав назад у шаблон конкурентів.
 */

export type BuildSlot = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  format: string | null;
  minutes: number;
  brief: string;
  lessonSlug: string | null;
  filled: boolean;
  note: string | null;
  filledAt: Date | null;
};

export type BuildStage = {
  id: string;
  slug: string;
  title: string;
  intent: string;
  icon: string | null;
  slots: BuildSlot[];
};

export type BuildView = {
  projectId: string;
  slug: string;
  title: string;
  outcome: string;
  estimate: string;
  coverUrl: string | null;
  stages: BuildStage[];
  filled: number;
  total: number;
  /** Перший незаповнений слот — єдине місце, куди веде головна кнопка. */
  next: (BuildSlot & { stageTitle: string }) | null;
};

/** Активний проєкт користувача. Збірка створюється при першому відкритті. */
export async function getBuild(userId: string): Promise<BuildView | null> {
  const project = await db.project.findFirst({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: {
          slots: {
            orderBy: { sortOrder: "asc" },
            include: { lesson: { select: { slug: true } } },
          },
        },
      },
    },
  });
  if (!project) return null;

  const build = await db.build.upsert({
    where: { userId_projectId: { userId, projectId: project.id } },
    create: { userId, projectId: project.id },
    update: {},
    include: { artifacts: true },
  });

  const bySlot = new Map(build.artifacts.map((a) => [a.slotId, a]));

  const stages: BuildStage[] = project.stages.map((stage) => ({
    id: stage.id,
    slug: stage.slug,
    title: stage.title,
    intent: stage.intent,
    icon: stage.icon,
    slots: stage.slots.map((slot) => {
      const artifact = bySlot.get(slot.id);
      return {
        id: slot.id,
        slug: slot.slug,
        title: slot.title,
        kind: slot.kind,
        format: slot.format,
        minutes: slot.minutes,
        brief: slot.brief,
        lessonSlug: slot.lesson?.slug ?? null,
        filled: Boolean(artifact),
        note: artifact?.note ?? null,
        filledAt: artifact?.filledAt ?? null,
      };
    }),
  }));

  const all = stages.flatMap((s) => s.slots);
  let next: BuildView["next"] = null;
  for (const stage of stages) {
    const open = stage.slots.find((s) => !s.filled);
    if (open) {
      next = { ...open, stageTitle: stage.title };
      break;
    }
  }

  return {
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    outcome: project.outcome,
    estimate: project.estimate,
    coverUrl: project.coverUrl,
    stages,
    filled: all.filter((s) => s.filled).length,
    total: all.length,
    next,
  };
}

/** Заповнити слот. Повторний виклик оновлює підпис, а не дублює артефакт. */
export async function fillSlot(userId: string, slotId: string, note: string | null) {
  const slot = await db.slot.findUnique({
    where: { id: slotId },
    include: { stage: { select: { projectId: true } } },
  });
  if (!slot) return { ok: false as const, code: "SLOT_NOT_FOUND" };

  const build = await db.build.upsert({
    where: { userId_projectId: { userId, projectId: slot.stage.projectId } },
    create: { userId, projectId: slot.stage.projectId },
    update: {},
  });

  await db.artifact.upsert({
    where: { buildId_slotId: { buildId: build.id, slotId } },
    create: { buildId: build.id, slotId, note },
    update: { note },
  });

  return { ok: true as const };
}

/** Звільнити слот — користувач має право передумати. */
export async function clearSlot(userId: string, slotId: string) {
  const slot = await db.slot.findUnique({
    where: { id: slotId },
    include: { stage: { select: { projectId: true } } },
  });
  if (!slot) return { ok: false as const, code: "SLOT_NOT_FOUND" };

  const build = await db.build.findUnique({
    where: { userId_projectId: { userId, projectId: slot.stage.projectId } },
  });
  if (!build) return { ok: true as const };

  await db.artifact.deleteMany({ where: { buildId: build.id, slotId } });
  return { ok: true as const };
}
