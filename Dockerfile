ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS deps

# Drop privileges and become the node user
USER node
WORKDIR /usr/src/app

# Install dependencies
COPY ./package.json ./package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:${NODE_VERSION}-alpine

# Drop privileges and become the node user
USER node
WORKDIR /usr/src/app

# Copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Add the rest of the application
ADD . .

EXPOSE 3000

ENTRYPOINT ["node", "bin/stromligning.js"]
