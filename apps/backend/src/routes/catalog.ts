import type { FastifyPluginAsync } from "fastify";
import { getAcademyCatalog, getCourseForUser } from "@aishka/core/progress/service";
import { requireAccessOf } from "../lib/auth";

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/catalog", async (req, reply) => {
    const user = await requireAccessOf(req);
    return reply.ok(await getAcademyCatalog(user.id));
  });

  app.get<{ Params: { slug: string } }>("/courses/:slug", async (req, reply) => {
    const user = await requireAccessOf(req);
    const course = await getCourseForUser(user.id, req.params.slug);
    if (!course) return reply.fail("not_found");
    return reply.ok(course);
  });
};
