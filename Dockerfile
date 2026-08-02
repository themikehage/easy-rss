FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS builder
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared

COPY apps/server ./apps/server
RUN cd apps/server && bun run build

COPY apps/client ./apps/client
RUN cd apps/client && bun run build

FROM base AS runner
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/client/dist ./public
COPY --from=builder /app/apps/server/drizzle ./drizzle

RUN mkdir -p /app/data && chmod 777 /app/data

ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
