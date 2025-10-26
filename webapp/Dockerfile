# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files từ webapp
COPY webapp/package*.json ./
RUN npm ci

# Copy file .env.production vào môi trường build
COPY webapp/.env.production .env.production

# Copy toàn bộ source
COPY webapp/ ./

# Build frontend
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy static files từ backend
COPY apps/public /usr/share/nginx/html/static

# Copy Nginx config
COPY webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]