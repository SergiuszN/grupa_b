# syntax=docker/dockerfile:1

FROM node:22-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Kod montowany jako wolumen w docker-compose, hot-reload przez pnpm dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]
