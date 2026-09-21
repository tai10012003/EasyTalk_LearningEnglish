# Stage 1: Dependencies (Cài đặt node_modules)
FROM node:18-alpine AS deps
WORKDIR /app

# Cài đặt công cụ build native (nếu có package như bcrypt, canvas...)
RUN apk add --no-cache python3 make g++

# Copy package files để tận dụng Docker layer cache
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Runtime (Môi trường chạy mượt nhẹ)
FROM node:18-alpine AS runner
WORKDIR /app

# Khai báo môi trường Production bắt buộc cho Node.js
ENV NODE_ENV=production

# Copy node_modules đã cài ở Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy mã nguồn dự án
COPY . .

# Chuyển sang user 'node' (không dùng quyền root để tăng bảo mật)
USER node

EXPOSE 3000

CMD ["npm", "start"]