# Use Alpine-based Node.js image
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

RUN npm run db:generate

# Build the application
RUN npm run build

# Remove dev dependencies and source code
RUN npm ci --only=production && \
    rm -rf src tsconfig.json package-lock.json


# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
