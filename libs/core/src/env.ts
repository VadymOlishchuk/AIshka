import { z } from "zod";

const EnvSchema = z.object({
  // Застосунок ходить сюди — через пул, якщо база хмарна.
  DATABASE_URL: z.string().min(1),
  // Пряме підключення для міграцій. Локально не потрібне.
  DIRECT_URL: z.string().optional(),
  AUTH_JWT_SECRET: z.string().min(32, "AUTH_JWT_SECRET must be at least 32 characters"),
  // Публічна адреса — для посилань у листах.
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  // Лендінги на піддоменах реєструють людину й ведуть на платформу: щоб cookie
  // сесії доїхали, вони мають ставитись на батьківський домен (".aishka.com").
  // Локально порожньо — на localhost cookie й так спільні між портами.
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  BILLING_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  // Звідки читати content/*.json. У контейнері API — /app/content.
  CONTENT_DIR: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment. Check your .env file:\n${details}`);
}

export const env = parsed.data;
