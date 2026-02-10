import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/dashscope-api': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dashscope-api/, ''),
      },
      '/custom-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/custom-api/, ''),
        configure: (proxy, options) => {
          // 动态代理配置，实际目标地址由请求头决定
          proxy.on('proxyReq', (proxyReq, req) => {
            const targetUrl = req.headers['x-custom-api-url'];
            if (targetUrl) {
              try {
                const url = new URL(targetUrl as string);
                proxyReq.setHeader('host', url.host);
              } catch (e) {
                console.error('Invalid custom API URL:', targetUrl);
              }
            }
          });
        },
      },
    },
  },
})
