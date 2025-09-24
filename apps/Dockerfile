# Sử dụng Node.js image
FROM node:18

# Tạo thư mục app
WORKDIR /app

# Copy file cấu hình và cài dependencies
COPY package*.json ./
RUN npm install --production

# Copy toàn bộ source backend
COPY . .

# Expose port
EXPOSE 3000

# Run app
CMD ["npm", "start"]