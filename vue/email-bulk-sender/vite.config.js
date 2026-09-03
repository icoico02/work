// Vite 的配置文件：开发服务器和打包时都会读取这里的设置。
import { defineConfig } from 'vite';
// 让 Vite 能够识别 .vue 单文件组件。
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 注册 Vue 插件。
  plugins: [vue()],
  server: {
    // 前端开发服务器的地址： http://localhost:5174
    port: 5174,
    proxy: {
      // 浏览器访问 /api/... 时，Vite 会把请求转发给本地 Node 后端。
      // 这样前端不需要知道后端端口，也能避免开发阶段的跨域问题。
      '/api': 'http://localhost:3001',
    },
  },
});
