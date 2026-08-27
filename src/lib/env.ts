import { z } from "zod";

const EnvSchema = z.object({
  // Застосунок ходить сюди — через пул, якщо база хмарна
  DATABASE_URL: z.string().min(1),
  // Пряме підключення для міграцій. Локально не потрібне.
  DIRECT_URL: z.string().optional(),
  AUTH_JWT_SECRET: z.string().min(32, "AUTH_JWT_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  BILLING_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment. Check your .env file:\n${details}`);
}

export const env = parsed.data;
