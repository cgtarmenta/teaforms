import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ssr from 'vite-plugin-ssr/plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    ssr({
      prerender: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@aws-amplify/ui-vue',
      'aws-amplify'
    ]
  },
  ssr: {
    noExternal: [
      '@aws-amplify/ui-vue',
      'aws-amplify'
    ]
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'aws-vendor': ['aws-amplify', '@aws-amplify/ui-vue'],
          'pdf-vendor': ['jspdf', 'pdf-lib'],
          'utils': ['date-fns', 'xmlbuilder2']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
})
