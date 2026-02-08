# Backend Dockerfile - Express.js + Sequelize + TypeScript

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Development command (ts-node-dev)
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source code and build
COPY src ./src
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files and install production dependencies only
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE 3001

# Run compiled JavaScript
CMD ["node", "dist/server.js"]
