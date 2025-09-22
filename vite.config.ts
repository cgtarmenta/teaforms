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
    // Output both client and SSR builds into the same folder `dist/`
    outDir: 'dist',
    emptyOutDir: false, // do not clear on SSR build; we clear once manually before client build
  },
})
