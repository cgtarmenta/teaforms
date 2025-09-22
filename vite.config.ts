// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],
  ssr: {
    // Add UI libs here if they must be bundled on SSR
    noExternal: [],
  },
  build: {
    // Client build output
    outDir: 'dist/client',
    emptyOutDir: false, // we build client and server separately
  },
})
