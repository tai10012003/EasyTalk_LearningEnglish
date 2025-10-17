# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files từ webapp
COPY webapp/package*.json ./
RUN npm ci

# Copy source webapp và build
COPY webapp/ ./
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine
# Copy build output (Vite build ra /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy static files từ backend (giờ path đúng rồi vì context là root)
COPY apps/public /usr/share/nginx/html/static

# Copy Nginx config
COPY webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]