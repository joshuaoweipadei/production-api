# Multi-stage build for Node.js production API
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Dependencies stage
FROM base AS dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage  
FROM base AS dev-dependencies
RUN npm ci

# Build stage
FROM dev-dependencies AS build
COPY . .
RUN npm run lint && npm run format:check

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nextjs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]

# Development stage
FROM dev-dependencies AS development

# Copy application code
COPY --chown=nextjs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]