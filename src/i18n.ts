import { createI18n as _createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'

export function createI18n(locale: string) {
  return _createI18n({
    legacy: false,
    globalInjection: true,
    locale: locale || 'es',
    fallbackLocale: 'en',
    messages: { es, en },
  })
}
