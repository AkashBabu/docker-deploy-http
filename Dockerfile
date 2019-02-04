# Stage-1 build
FROM node:latest as build

RUN mkdir /docker-deploy-http
WORKDIR /docker-deploy-http

ADD package.json .
RUN ["npm", "i", "-q"]

ADD . .
RUN ["npm", "run", "build"]


# Stage-2 dependencies
FROM node:latest as dep

RUN mkdir /docker-deploy-http
WORKDIR /docker-deploy-http

ADD package.json .
RUN ["npm", "i", "--only=production"]


# Stage-3 final image
FROM node:alpine

# install docker
RUN apk update && apk add docker

RUN mkdir /docker-deploy-http
WORKDIR /docker-deploy-http

COPY --from=build /docker-deploy-http/dist ./dist
COPY --from=dep /docker-deploy-http/node_modules ./node_modules

HEALTHCHECK --interval=30s --timeout=10s --start-period=3s --retries=2 CMD [ "npm", "run", "health" ]

ADD . .

RUN ["npm", "rebuild", "-q"]

ENTRYPOINT [ "npm", "start" ]