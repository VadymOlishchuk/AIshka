# AIshka

Практична AI-платформа: персональний план, збірка проєкту, уроки, прогрес.

## Запуск

```
cp .env.example .env         # і постав AUTH_JWT_SECRET: openssl rand -base64 48
pnpm install
pnpm db:up                   # Postgres у Docker на :5433
pnpm db:deploy && pnpm content:sync
pnpm dev                     # main :5173, landing :5174, backend :3001
```

Або все в Docker: `pnpm docker:dev` (hot reload, ті самі порти) чи `pnpm docker:prod`
(main на :3000, landing на :3100).

Структура, команди й рішення — у `CLAUDE.md`.
