# Платформа: збирається Vite у статику, віддається nginx. /api проксіюється в api —
# з браузера все один домен, cookie SameSite працюють без CORS.
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json prisma.config.ts ./
COPY prisma ./prisma
COPY apps/backend/package.json apps/backend/
COPY apps/main/package.json apps/main/
COPY apps/landing/package.json apps/landing/
COPY libs/core/package.json libs/core/
COPY libs/ui/package.json libs/ui/
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm install --frozen-lockfile
COPY libs ./libs
COPY apps/main ./apps/main
COPY content ./content
# Адреса лендінгу вшивається в бандл: туди ведуть тих, у кого ще немає акаунта.
ARG VITE_LANDING_URL=http://localhost:3100
ENV VITE_LANDING_URL=$VITE_LANDING_URL
RUN pnpm --filter @aishka/main build

FROM nginx:1.27-alpine
COPY apps/main/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/main/dist /usr/share/nginx/html
EXPOSE 80
