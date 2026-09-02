import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { OrderView } from "@aishka/core/billing/checkout";
import { ApiError, api } from "@aishka/ui/api";
import { Button, Card, Pill } from "@aishka/ui/primitives";
import { useTitle } from "@aishka/ui/title";
import { MAIN_URL } from "@/config";

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

/**
 * Крок 2: оплата. Зараз — заглушка «оплатити» для розробки; зі Stripe тут
 * буде редірект на Checkout, а завершення прийде вебхуком. Сторінка при цьому
 * не зміниться: вона показує замовлення й веде далі.
 */
export function Checkout() {
  useTitle("Payment · AIshka");
  const order = useLoaderData() as OrderView;
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await api.post<{ paid: boolean; next: string | null }>(`/api/checkout/${order.id}/complete`);
      // Немає кроку з паролем — значить, пароль уже є: на вхід у платформу.
      if (res.next) navigate(res.next);
      else window.location.assign(`${MAIN_URL}/login`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't reach the server. Try again.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7">
        <Pill tone="mark" className="mb-4">Step 2 of 3</Pill>
        <h1 className="mb-1 text-[28px] font-semibold leading-tight text-ink-strong">
          {order.planTitle}
        </h1>
        <p className="mb-6 text-[15px] text-ink-muted">For {order.email}</p>

        <div className="mb-6 flex items-baseline justify-between rounded-[14px] bg-paper-alt px-4 py-3.5">
          <span className="text-[14px] text-ink-muted">One year, every course</span>
          <span className="text-[24px] font-extrabold tabular-nums text-ink-strong">
            {money(order.amountCents, order.currency)}
          </span>
        </div>

        {order.provider === "stub" ? (
          <>
            <Button onClick={pay} disabled={pending} className="w-full">
              {pending ? "One moment…" : `Pay ${money(order.amountCents, order.currency)} · test mode`}
            </Button>
            <p className="mt-3 text-center text-[12.5px] text-ink-muted">
              Test mode: no card is charged. Stripe replaces this button in production.
            </p>
          </>
        ) : (
          <p className="rounded-[10px] bg-error-tint px-4 py-3 text-[14px] text-ink-strong">
            Payment provider isn&apos;t configured yet.
          </p>
        )}

        {error ? (
          <p className="mt-4 rounded-[10px] bg-error-tint px-4 py-3 text-[14px] text-ink-strong" role="alert">
            {error}
          </p>
        ) : null}
      </Card>
    </main>
  );
}
