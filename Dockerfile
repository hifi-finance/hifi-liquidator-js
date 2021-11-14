FROM node:16-slim
LABEL author="scorpion9979 <ahmed.i.tawefeeq@protonmail.com>"
WORKDIR /bot
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --ignore-scripts
COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.prod.json ./tsconfig.prod.json
RUN yarn build
ENTRYPOINT yarn start
