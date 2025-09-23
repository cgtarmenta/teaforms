// Nuxt 3 config (promoted to root)
import { fileURLToPath } from 'node:url'

const reposPath = fileURLToPath(new URL('./server/repositories/index.js', import.meta.url))

export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxtjs/tailwindcss'],
  alias: {
    '#repos': reposPath,
  },
  app: {
    head: {
      title: 'TeaForms',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' }
      ]
    }
  },
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    SESSION_SECRET: '',
    DDB_TABLE: '',
    AWS_REGION: '',
    DATA_BACKEND: '',
    DDB_ENDPOINT: '',
    DDB_CREATE_TABLES: '',
    public: { BASE: '/' }
  }
})

