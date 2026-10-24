FROM node:24.21.0-alpine AS build
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

FROM platformatic/node-caged:26.12.1-alpine AS node-caged

FROM alpine:3.21.9 AS node-strip
RUN apk add --no-cache binutils
COPY --from=node-caged /usr/local/bin/node /usr/local/bin/node
RUN strip --strip-all /usr/local/bin/node

FROM alpine:3.21.9
RUN apk add --no-cache ca-certificates libssl3 libstdc++ libgcc
COPY --from=node-strip /usr/local/bin/node /usr/local/bin/node
WORKDIR /app

COPY --from=build /app/.output/ ./

ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
