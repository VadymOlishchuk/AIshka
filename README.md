# AIshka

Практична AI-платформа: персональний план, збірка проєкту, уроки, прогрес.

## Запуск

```
cp .env.example .env         # і постав AUTH_JWT_SECRET: openssl rand -base64 48
pnpm install
pnpm db:up && pnpm db:deploy && pnpm content:sync   # перший раз: база, міграції, контент
pnpm dev:all                 # сам піднімає Postgres, потім main :5173, landing :5174, backend :3001
```

Прод у Docker: `pnpm docker:prod` (main на :3000, landing на :3100).

Структура, команди й рішення — у `CLAUDE.md`.
