# AIshka

Навчальна платформа з персональним планом уроків.

## Запуск

```bash
cp .env.example .env          # згенеруйте AUTH_JWT_SECRET: openssl rand -base64 48
docker compose up -d          # Postgres на localhost:5433
pnpm install
pnpm db:migrate
pnpm content:sync             # валідує контент і заливає в БД
pnpm dev                      # http://localhost:3000
```

## Структура

```
content/           курси, онбординг і правила плану — джерело правди для контенту
prisma/            схема БД і міграції
scripts/           перевірка та імпорт контенту
src/app/           маршрути: (auth), (app)/onboarding, (app)/dashboard, api
src/core/          домен: auth, content, plan, progress, http — без React
src/components/    інтерфейс
src/proxy.ts       маршрутизація доступу (Next 16 замінив middleware на proxy)
```

## Що працює зараз

Реєстрація й вхід із ротацією сесій · онбординг на 6 питань · збирання
персонального плану за правилами · плеєр уроку з квізами · послідовне відкриття
уроків · прогрес по курсу · гейт публікації контенту.
