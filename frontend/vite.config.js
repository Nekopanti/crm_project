import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'My Vue App'
        }
      },
      template: 'index.html',
      filename: path.resolve(__dirname, '../templates/index.html')  // 确保 index.html 输出到项目根目录下的 templates/
    })
  ],
  build: {
    outDir: path.resolve(__dirname, '../static'), // 让静态资源输出到项目根目录的 static/
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.js'
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
})
