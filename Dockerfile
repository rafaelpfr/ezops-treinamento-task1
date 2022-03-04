# Temporary image with OS dependencies to install Node.js libraries (Stage 1)
FROM node@sha256:d5ff6716e21e03983f8522b6e84f15f50a56e183085553e96d2801fc45dc3c74 AS BUILD_IMAGE

RUN apk -U upgrade

WORKDIR /usr/src/app

# Install OS dependencies (not necessary for production image)
# RUN apk add gcc make automake g++ zlib-dev autoconf libtool nasm

COPY simple-chat/package*.json ./

# Install dependencies
RUN npm ci --production



# Build tiny production image (Stage 2)
FROM node@sha256:d5ff6716e21e03983f8522b6e84f15f50a56e183085553e96d2801fc45dc3c74

RUN apk -U upgrade

# dumb-init will run as an init system (PID 1) ensuring that all signals are proxied to Node.js process
RUN apk add dumb-init

# Some frameworks and libraries may only turn on the optimized configuration that is suited to production if NODE_ENV is set to production
ENV NODE_ENV production

EXPOSE 3000

# Don’t run containers as root (least privilege)
USER node

WORKDIR /usr/src/app

# Copy node_modules from BUILD_IMAGE
COPY --chown=node:node --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

# Copy application files
COPY --chown=node:node simple-chat/ .

CMD ["dumb-init", "node", "server.js"] 
