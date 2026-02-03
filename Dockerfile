# 🐳 Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for caching instructions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (Modern Prisma 7 style)
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN rm -rf dist && npm run build

# 🐳 Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/

# Set environment to production
ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "run", "start"]
