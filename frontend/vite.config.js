import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'

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
      filename: '../../templates/index.html'  // 将 index.html 输出到 templates/ 目录
    })
  ],
  build: {
    outDir: '../static',  // 将静态文件输出到 static/ 目录
    emptyOutDir: true,     // 构建前清空输出目录
    rollupOptions: {
      input: {
        main: './src/main.js'  // 指定入口文件
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',  // JS 文件输出到 static/js/
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'  // 静态资源输出到 static/assets/
      }
    }
  }
})