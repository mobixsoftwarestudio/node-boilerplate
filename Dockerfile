# Stage 1: Build /dist with Typescript
FROM node:12-slim AS builder

COPY package.json yarn.lock /usr/src/app/node-boilerplate/

WORKDIR /usr/src/app/node-boilerplate

RUN yarn install && yarn cache clean

COPY . /usr/src/app/node-boilerplate

RUN yarn build

# Stage 2: Copy /dist and only install node_modules for production
FROM node:12-slim

WORKDIR /usr/src/app/node-boilerplate

COPY package.json yarn.lock ./

RUN yarn install --prod && yarn cache clean

COPY --from=builder /usr/src/app/node-boilerplate/dist ./dist

EXPOSE 8080

CMD [ "yarn", "start" ]
