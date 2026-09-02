import type { FastifyPluginAsync } from "fastify";
import { requireUserOf } from "../lib/auth";

/** Хто я. Єдине, що знає клієнт про сесію — решта завжди перевіряється на сервері. */
export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", async (req, reply) => {
    const user = await requireUserOf(req);
    return reply.ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      createdAt: user.createdAt,
      onboardingDone: user.onboardingDone,
      onboardingStep: user.onboardingStep,
    });
  });
};
