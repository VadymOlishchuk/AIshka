import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { ZodError } from "zod";
import { AppError, STATUS, errorBody } from "@aishka/core/http/errors";
import { fieldErrors } from "@aishka/core/auth/schemas";
import { envelope } from "./plugins/envelope";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { onboardingRoutes } from "./routes/onboarding";
import { buildRoutes } from "./routes/build";
import { catalogRoutes } from "./routes/catalog";
import { lessonRoutes } from "./routes/lessons";
import { landingRoutes } from "./routes/landing";

/**
 * Збирає застосунок без прослуховування порту — так його можна підняти
 * і в main.ts, і в тесті через app.inject().
 */
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      // Cookie з токенами не мають потрапляти в логи ні за яких обставин.
      redact: ["req.headers.cookie", "req.headers.authorization"],
    },
    trustProxy: true,
  });

  await app.register(cookie);
  await app.register(envelope);

  // Одна точка, де помилка домену стає відповіддю. Тіло — завжди конверт.
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      if (error.headers) reply.headers(error.headers);
      return reply
        .status(STATUS[error.code])
        .send(errorBody(error.code, { message: error.message, fields: error.fields }));
    }
    if (error instanceof ZodError) {
      return reply
        .status(STATUS.validation_failed)
        .send(errorBody("validation_failed", { fields: fieldErrors(error) }));
    }
    // Битий JSON у тілі — вина клієнта, не наша.
    if ((error as { statusCode?: number }).statusCode === 400) {
      return reply.status(422).send(errorBody("validation_failed"));
    }
    app.log.error(error, "[unhandled]");
    return reply.status(500).send(errorBody("internal"));
  });

  app.setNotFoundHandler((_req, reply) => reply.status(404).send(errorBody("not_found")));

  app.get("/api/health", async () => ({ ok: true, data: { status: "up" } }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(meRoutes, { prefix: "/api" });
  await app.register(onboardingRoutes, { prefix: "/api/onboarding" });
  await app.register(buildRoutes, { prefix: "/api/build" });
  await app.register(catalogRoutes, { prefix: "/api" });
  await app.register(lessonRoutes, { prefix: "/api/lessons" });
  await app.register(landingRoutes, { prefix: "/api" });

  return app;
}
