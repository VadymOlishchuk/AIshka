import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "@aishka/core/env";
import { rateLimit } from "@aishka/core/auth/rate-limit";
import { emailField, fieldErrors } from "@aishka/core/auth/schemas";
import { completeCheckout, getOrder, startCheckout } from "@aishka/core/billing/checkout";
import { requestIp } from "../lib/auth";

const StartInput = z.object({
  firstName: z.string().min(1, "Enter your first name").max(60).trim(),
  email: emailField,
});

/**
 * Воронка лендінгу. Публічна: у людини ще немає ні сесії, ні пароля.
 *   POST /start            email + ім'я -> замовлення
 *   GET  /:id              що і за скільки — для сторінки оплати
 *   POST /:id/complete     заглушка оплати; зі Stripe цей крок робить вебхук
 */
export const checkoutRoutes: FastifyPluginAsync = async (app) => {
  app.post("/start", async (req, reply) => {
    const parsed = StartInput.safeParse(req.body);
    if (!parsed.success) {
      return reply.fail("validation_failed", { fields: fieldErrors(parsed.error) });
    }

    // І за IP, і за поштою: інакше одну адресу можна засипати замовленнями.
    const gate = await rateLimit(
      [`checkout:ip:${requestIp(req)}`, `checkout:acc:${parsed.data.email}`],
      { limit: 10, windowSec: 3600 },
    );
    if (!gate.allowed) {
      return reply.fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
    }

    const { orderId } = await startCheckout(parsed.data);
    return reply.ok({ orderId, next: `/checkout/${orderId}` });
  });

  app.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const order = await getOrder(req.params.id);
    if (!order) return reply.fail("not_found");
    return reply.ok(order);
  });

  /**
   * Заглушка оплати. Існує лише коли PAYMENTS_PROVIDER=stub — на проді зі
   * Stripe цього маршруту немає взагалі, а не «є, але вимкнений».
   */
  if (env.PAYMENTS_PROVIDER === "stub") {
    app.post<{ Params: { id: string } }>("/:id/complete", async (req, reply) => {
      const gate = await rateLimit([`checkout-complete:ip:${requestIp(req)}`], { limit: 10, windowSec: 600 });
      if (!gate.allowed) {
        return reply.fail("rate_limited", { headers: { "Retry-After": String(gate.retryAfter) } });
      }

      const { passwordToken } = await completeCheckout(req.params.id, `stub_${req.params.id}`);
      // Є токен — ставимо пароль; його немає — у людини вже є пароль, їй на вхід.
      return reply.ok({
        paid: true,
        next: passwordToken ? `/set-password?token=${passwordToken}` : null,
      });
    });
  }
};
