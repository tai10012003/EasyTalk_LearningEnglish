# Stage 1: Build React/Vite app
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files từ webapp
COPY webapp/package*.json ./
RUN npm ci

# Copy toàn bộ source code webapp và tiến hành build
COPY webapp/ ./
RUN npm run build

# Stage 2: Serve tĩnh bằng Nginx nhẹ mượt
FROM nginx:alpine

# Xóa các file HTML mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy file build output (Vite build ra /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx riêng cho dự án
COPY webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]