/**
 * Один тариф. Ціна тут, а не в контенті: це не навчальний матеріал, а
 * комерційна умова, і міняється вона з іншою частотою й іншими людьми.
 */
export const PLAN = {
  code: "launch",
  title: "AIshka — full access",
  priceCents: 4900,
  currency: "usd",
  intervalDays: 365,
} as const;

export type Plan = typeof PLAN;
