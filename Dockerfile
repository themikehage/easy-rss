FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "apps/server/src/index.ts"]
