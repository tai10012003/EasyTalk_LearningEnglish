# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Copy file .env.production vào môi trường production
COPY .env.production .env

EXPOSE 3000
CMD ["npm", "start"]