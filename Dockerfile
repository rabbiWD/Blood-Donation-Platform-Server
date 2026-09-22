# Multi-stage Dockerfile for Blood Donation Platform Backend

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package metadata
COPY package*.json ./

# Copy Prisma schema and config first so npm postinstall (prisma generate) succeeds
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies based on package-lock.json if present
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src/

# Build application bundle into dist/server.js
RUN npm run build

# Prune devDependencies for production runtime
RUN npm prune --production

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package metadata
COPY package*.json ./

# Copy production node_modules (with generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma directory and config for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts ./

# Copy docker entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Expose default port
EXPOSE 5000

# Use entrypoint to run migrations before server startup
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
