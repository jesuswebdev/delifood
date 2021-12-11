FROM node:17-alpine as deps
WORKDIR /usr/app
COPY ./package*.json ./
RUN npm ci --only=production

FROM node:17-alpine 
COPY --from=deps ./usr/app/ ./
COPY ./lib/ ./lib/

CMD [ "npm", "start" ]
