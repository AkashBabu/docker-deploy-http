# Stage-1 build
FROM node:latest as build

RUN mkdir /docker-deploy-mqtt
WORKDIR /docker-deploy-mqtt

ADD package.json .
RUN ["npm", "i", "-q"]

ADD . .
RUN ["npm", "run", "build"]


# Stage-2 dependencies
FROM node:latest as dep

RUN mkdir /docker-deploy-mqtt
WORKDIR /docker-deploy-mqtt

ADD package.json .
RUN ["npm", "i", "--only=production"]


# Stage-3 final image
FROM node:alpine

# install docker
RUN apk update && apk add docker

RUN mkdir /docker-deploy-mqtt
WORKDIR /docker-deploy-mqtt

COPY --from=build /docker-deploy-mqtt/dist ./dist
COPY --from=dep /docker-deploy-mqtt/node_modules ./node_modules

HEALTHCHECK --interval=1m --timeout=10s --start-period=5s --retries=2 CMD [ "npm", "run", "health" ]

ADD . .

RUN ["npm", "rebuild", "-q"]

ENTRYPOINT [ "npm", "start" ]