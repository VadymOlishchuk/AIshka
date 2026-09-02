import { db } from "../db";
import { env } from "../env";
import { AppError } from "../http/errors";
import { issuePasswordToken } from "../auth/password-reset";
import { FIRST_STEP } from "../plan/onboarding";
import { PLAN } from "./plans";

/**
 * Воронка лендінгу: email -> оплата -> пароль -> платформа.
 *
 * Акаунт створюється в момент введення email — без пароля. Так замовлення
 * має до кого належати ще до оплати, а людина, що відпала на платежі,
 * лишається в базі як лід. Увійти без пароля неможливо: verifyPassword
 * на порожньому хеші завжди false.
 */
export async function startCheckout(input: { email: string; firstName: string }) {
  const user = await db.user.upsert({
    where: { email: input.email },
    create: { email: input.email, firstName: input.firstName, onboardingStep: FIRST_STEP },
    // Той, хто вже є, не втрачає ім'я через одруківку у формі.
    update: {},
    select: { id: true, passwordHash: true },
  });

  const order = await db.order.create({
    data: {
      userId: user.id,
      email: input.email,
      planCode: PLAN.code,
      amountCents: PLAN.priceCents,
      currency: PLAN.currency,
      status: "pending",
      provider: env.PAYMENTS_PROVIDER,
    },
  });

  return { orderId: order.id };
}

export type OrderView = {
  id: string;
  email: string;
  planCode: string;
  planTitle: string;
  amountCents: number;
  currency: string;
  status: string;
  provider: string;
};

export async function getOrder(orderId: string): Promise<OrderView | null> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  return {
    id: order.id,
    email: order.email,
    planCode: order.planCode,
    planTitle: PLAN.title,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    provider: order.provider,
  };
}

/**
 * Оплата пройшла. Викликається заглушкою в dev і — згодом — Stripe-вебхуком;
 * providerRef робить виклик ідемпотентним: повторний вебхук нічого не подвоїть.
 *
 * Повертає токен на встановлення пароля, якщо пароля ще немає: людина в цей
 * момент сидить у браузері, і вести її через пошту було б зайвим кроком.
 * Лист із тим самим посиланням теж іде — на випадок, якщо вкладку закрили.
 */
export async function completeCheckout(orderId: string, providerRef: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order) throw new AppError("not_found");

  if (order.status !== "paid") {
    const periodEnd = new Date(Date.now() + PLAN.intervalDays * 24 * 60 * 60 * 1000);
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "paid", paidAt: new Date(), providerRef },
      }),
      db.subscription.upsert({
        where: { userId: order.userId },
        create: {
          userId: order.userId,
          planCode: order.planCode,
          status: "active",
          priceCents: order.amountCents,
          currency: order.currency,
          intervalDays: PLAN.intervalDays,
          currentPeriodEnd: periodEnd,
        },
        update: { status: "active", currentPeriodEnd: periodEnd, canceledAt: null, cancelAtPeriodEnd: false },
      }),
    ]);
  }

  const passwordToken = order.user.passwordHash ? null : await issuePasswordToken(order.email, "set");
  return { passwordToken };
}
