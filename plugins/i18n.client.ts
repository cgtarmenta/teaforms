import { createI18n } from 'vue-i18n'
import es from '../locales/es.json'
import en from '../locales/en.json'

export default defineNuxtPlugin((nuxtApp) => {
  const seeded = (globalThis as any)?.window?.__LOCALE__
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: seeded || 'es',
    fallbackLocale: 'en',
    messages: { es, en },
  })
  nuxtApp.vueApp.use(i18n)
})

