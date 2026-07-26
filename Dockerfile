# syntax=docker/dockerfile:1
FROM node:24-alpine AS base

RUN corepack enable

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml* ./

RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    --mount=type=cache,target=/root/.cache \
    yarn install --immutable

# ---- Build Stage ----
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# ---- Production Dependencies Stage ----
FROM base AS prod-deps

COPY package.json yarn.lock .yarnrc.yml* ./

RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    --mount=type=cache,target=/root/.cache \
    yarn workspaces focus --production && yarn cache clean

# ---- Release Stage ----
FROM base AS release

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

USER node

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./

CMD ["node", "dist/main"]