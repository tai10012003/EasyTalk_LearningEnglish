# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app

# Cài dependencies
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source và build
COPY . .
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine
# Copy build output (Vite mặc định build ra /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx config (đã chỉnh proxy /api)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]