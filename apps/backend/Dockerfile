# API: Fastify на Node 24 LTS. Запускається через tsx прямо з джерел —
# Prisma-клієнт із WASM-компілятором і нативний argon2 бандлити ненадійно,
# а компілювати tsc заради одного процесу немає сенсу.
FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json prisma.config.ts ./
COPY prisma ./prisma
COPY apps/backend/package.json apps/backend/
COPY apps/main/package.json apps/main/
COPY apps/landing/package.json apps/landing/
COPY libs/core/package.json libs/core/
COPY libs/ui/package.json libs/ui/
# postinstall генерує Prisma-клієнт; йому потрібен лише рядок, не жива база.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm install --frozen-lockfile

FROM deps AS runtime
COPY libs/core ./libs/core
COPY apps/backend ./apps/backend
COPY content ./content
COPY scripts ./scripts
RUN pnpm prisma generate
ENV NODE_ENV=production
ENV API_PORT=3001
ENV CONTENT_DIR=/app/content
EXPOSE 3001
CMD ["pnpm", "--filter", "@aishka/backend", "start"]
