import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Міграції ходять НАПРЯМУ, а не через пул: DDL і блокування Prisma
    // не працюють через транзакційний пулер. Локально DIRECT_URL немає —
    // тоді підходить звичайний DATABASE_URL.
    url: process.env.DIRECT_URL ? env("DIRECT_URL") : env("DATABASE_URL"),
  },
});
