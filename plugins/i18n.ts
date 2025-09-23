import { createI18n } from 'vue-i18n'
import es from '../locales/es.json'
import en from '../locales/en.json'

export default defineNuxtPlugin((nuxtApp) => {
  let locale = 'es'
  if (process.server) {
    const headers = useRequestHeaders(['cookie','accept-language'])
    const rawCookie = headers.cookie || ''
    const fromCookie = rawCookie.split('locale=')[1]?.split(';')[0]
    const accept = String(headers['accept-language'] || '')
    locale = fromCookie || (accept.toLowerCase().startsWith('en') ? 'en' : 'es')
  } else if (process.client) {
    try {
      const c = useCookie('locale')
      locale = c.value || (navigator?.language?.toLowerCase().startsWith('en') ? 'en' : 'es')
    } catch {}
  }

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: { es, en },
  })
  nuxtApp.vueApp.use(i18n)
})

