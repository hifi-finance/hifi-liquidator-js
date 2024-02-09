FROM --platform=linux/amd64 node:20-alpine AS base
LABEL author="scorpion9979 <ahmed.i.tawefeeq@protonmail.com>"
WORKDIR /liquidator

# 1. Cache dependencies.
FROM base AS cache
COPY ./.yarnrc.yml ./.yarnrc.yml
COPY ./.yarn/ ./.yarn/
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --immutable
RUN npm prune --production --no-package-lock

# 2. Build the code.
FROM base AS build
COPY ./.yarnrc.yml ./.yarnrc.yml
COPY ./.yarn/ ./.yarn/
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --immutable
COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.prod.json ./tsconfig.prod.json
RUN yarn build

# 3. Runtime environment.
FROM base AS release
COPY --from=build /liquidator/dist ./dist
COPY --from=build /liquidator/package.json ./
COPY --from=cache /liquidator/node_modules ./node_modules
ENTRYPOINT node .
