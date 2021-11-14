FROM node:16-slim AS base
LABEL author="scorpion9979 <ahmed.i.tawefeeq@protonmail.com>"
WORKDIR /bot

# 1. Cache dependencies.
FROM base AS cache
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --production --ignore-scripts

# 2. Build the code.
FROM base AS build
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --ignore-scripts
COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.prod.json ./tsconfig.prod.json
RUN yarn build

# 3. Runtime environment.
FROM base AS release
COPY --from=build /bot/dist ./dist
COPY --from=build /bot/package.json ./
COPY --from=cache /bot/node_modules ./node_modules
ENTRYPOINT yarn start
