# Лендінг: статика з Vite під nginx. Окремий контейнер, бо живе на іншому
# піддомені й деплоїться незалежно від платформи; бекенд у них спільний.
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
COPY apps/landing ./apps/landing
COPY content ./content
# Адреса платформи вшивається в бандл під час збірки.
ARG VITE_MAIN_URL=http://localhost:3000
ENV VITE_MAIN_URL=$VITE_MAIN_URL
RUN pnpm --filter @aishka/landing build

FROM nginx:1.27-alpine
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
