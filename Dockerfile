FROM node:12.18.1-alpine as build-stage

COPY . /app

RUN rm -rf frontend-angular-app

ENV NODE_ENV=development

WORKDIR /app

RUN npm i

RUN npm run build

CMD ["node","dist/index.js"]
