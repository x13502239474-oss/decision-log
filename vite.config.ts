import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署在 https://<user>.github.io/decision-log/ 子路径下。
// 本地开发使用根路径；构建时默认使用仓库名作为 base。
// 如需部署到用户名主页仓库或自定义域名，可设置 VITE_BASE=/ 。
export default defineConfig(({ command, isPreview }) => ({
  // preview 与 build 必须使用同一个 base，否则本地预览时 /decision-log/assets/*
  // 会被 SPA fallback 成 index.html（MIME 为 text/html），module 脚本将无法执行。
  base: process.env.VITE_BASE ?? (command === 'build' || isPreview ? '/decision-log/' : '/'),
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
}))
