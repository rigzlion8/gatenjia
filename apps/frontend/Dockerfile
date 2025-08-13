FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy configuration files
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Copy source code
COPY src ./src
COPY public ./public
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY styles ./styles

# Build the application
RUN yarn build

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["yarn", "start"]
