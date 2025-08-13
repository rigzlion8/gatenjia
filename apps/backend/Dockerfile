FROM node:20-alpine

# Install OpenSSL and other required libraries for Prisma
RUN apk add --no-cache openssl libssl1.1-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source code
COPY . ./

# Ensure Prisma schema is available
COPY prisma ./prisma/

# Build backend
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

# Health check (using wget which is available in Alpine by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["npm", "start"]
