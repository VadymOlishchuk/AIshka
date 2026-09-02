import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "@aishka/core/db";
import { completeLesson, getLessonForUser } from "@aishka/core/progress/service";
import { requireAccessOf } from "../lib/auth";

const RatingInput = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

type Slug = { Params: { slug: string } };

export const lessonRoutes: FastifyPluginAsync = async (app) => {
  /**
   * Тіла блоків віддаються тільки після перевірки доступу — приховати
   * кнопку в інтерфейсі недостатньо, каталог викачується скриптом.
   */
  app.get<Slug>("/:slug", async (req, reply) => {
    const user = await requireAccessOf(req);
    const found = await getLessonForUser(user.id, req.params.slug);
    if (!found) return reply.fail("not_found");
    if (found.locked) return reply.fail("forbidden", { message: "Finish the previous lesson first." });
    return reply.ok(found.lesson);
  });

  app.post<Slug>("/:slug/complete", async (req, reply) => {
    const user = await requireAccessOf(req);

    const found = await getLessonForUser(user.id, req.params.slug);
    if (!found) return reply.fail("not_found");
    if (found.locked) return reply.fail("forbidden", { message: "Finish the previous lesson first." });

    await completeLesson(user.id, found.lesson.id, found.lesson.courseId);

    const total = await db.progress.count({
      where: { userId: user.id, courseId: found.lesson.courseId },
    });
    return reply.ok({ completed: true, completedLessons: total });
  });

  app.post<Slug>("/:slug/rating", async (req, reply) => {
    const user = await requireAccessOf(req);

    const parsed = RatingInput.safeParse(req.body);
    if (!parsed.success) return reply.fail("validation_failed");

    const lesson = await db.lesson.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!lesson) return reply.fail("not_found");

    // Одна оцінка на урок: повторна відправка з коментарем оновлює попередню.
    await db.lessonRating.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      create: { userId: user.id, lessonId: lesson.id, ...parsed.data },
      update: parsed.data,
    });
    return reply.ok({ saved: true });
  });
};
