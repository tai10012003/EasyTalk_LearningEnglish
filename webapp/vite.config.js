import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
// Nghĩa là thay vì phải import dài dòng theo kiểu tương đối
// Dùng alias @ (trỏ đến ./src) để viết gọn hơn:
// resolve.alias là nơi Vite cho phép định nghĩa bí danh (alias) cho các đường dẫn.
// '@' là tên alias bạn đặt.
// path.resolve(__dirname, './src') nghĩa là '@' sẽ trỏ đến thư mục src trong project.