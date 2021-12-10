FROM node:alpine

WORKDIR /usr/app
COPY ./package*.json ./
RUN npm install --only=production
COPY ./ ./
ENV NODE_ENV production
EXPOSE 8080

CMD [ "npm", "start" ]
