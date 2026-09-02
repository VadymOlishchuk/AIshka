import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { ZodError } from "zod";
import { AppError, STATUS, errorBody } from "@aishka/core/http/errors";
import { fieldErrors } from "@aishka/core/auth/schemas";
import { cleanupAuthTables } from "@aishka/core/auth/maintenance";
import { env } from "@aishka/core/env";
import { setLogger } from "@aishka/core/log";
import { envelope } from "./plugins/envelope";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { onboardingRoutes } from "./routes/onboarding";
import { buildRoutes } from "./routes/build";
import { catalogRoutes } from "./routes/catalog";
import { lessonRoutes } from "./routes/lessons";
import { landingRoutes } from "./routes/landing";
import { checkoutRoutes } from "./routes/checkout";

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
    // Лише за своїм nginx: інакше X-Forwarded-For підставляє будь-хто
    // й обходить ліміти за IP.
    trustProxy: env.TRUST_PROXY,
  });

  // Події безпеки з домену — у той самий структурований лог, що й усе інше.
  setLogger(app.log);

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
  await app.register(checkoutRoutes, { prefix: "/api/checkout" });

  // Таблиці auth не чистять себе самі: раз на годину, і одразу на старті.
  const sweep = async () => {
    try {
      const n = await cleanupAuthTables();
      app.log.info(n, "auth tables swept");
    } catch (error) {
      app.log.error(error, "auth sweep failed");
    }
  };
  app.addHook("onReady", sweep);
  const timer = setInterval(sweep, 60 * 60 * 1000);
  timer.unref();
  app.addHook("onClose", async () => clearInterval(timer));

  return app;
}
