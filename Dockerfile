# syntax=docker/dockerfile:1
# Multi-stage build for Fastify TypeScript app

ARG NODE_VERSION=20

# ====================
# Stage 1: Build
# ====================
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build:ts

# ====================
# Stage 2: Production
# ====================
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint for Docker Secrets support
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fastify -u 1001

USER fastify

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000

ENV FASTIFY_ADDRESS=0.0.0.0
ENV FASTIFY_PORT=3000
ENV NODE_ENV=production

# Healthcheck using wget (available in busybox/alpine by default)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npx", "fastify", "start", "-l", "info", "dist/app.js"]
