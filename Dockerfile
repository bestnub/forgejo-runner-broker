FROM node:24-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
    corepack prepare pnpm --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
ENV NODE_ENV=production
RUN pnpm run build

FROM node:24-alpine
WORKDIR /app

COPY --from=build /app/.output/ ./

ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
