# 1. Dùng môi trường Node.js bản rút gọn cho nhẹ
FROM node:20-alpine

# 2. Tạo thư mục chứa code bên trong Docker
WORKDIR /app

# 3. Copy file quản lý thư viện vào trước
COPY package*.json ./

# 4. Cài đặt các thư viện (dependencies)
RUN npm install --production

# 5. Copy toàn bộ code còn lại vào trong Docker
COPY . .

# 6. Mở cổng 8080 bên trong Docker
EXPOSE 8080

# 7. Lệnh để chạy ứng dụng (Thay 'server.js' hoặc 'app.js' bằng file chạy chính của bạn)
CMD ["node", "server.js"]