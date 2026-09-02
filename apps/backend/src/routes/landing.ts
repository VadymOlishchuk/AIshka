import type { FastifyPluginAsync } from "fastify";
import { db } from "@aishka/core/db";

/** Публічна вітрина: кілька опублікованих курсів для лендінгу, без авторизації. */
export const landingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/landing", async (_req, reply) => {
    const courses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { modules: true } } },
      take: 6,
    });
    return reply.ok(
      courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        units: c._count.modules,
      })),
    );
  });
};
