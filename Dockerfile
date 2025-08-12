FROM node:20-slim

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source code
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
COPY apps/frontend/next.config.js ./
COPY apps/frontend/tailwind.config.js ./
COPY apps/frontend/postcss.config.js ./
COPY apps/frontend/tsconfig.json ./

# Build the application
RUN npm run build

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "start"]
