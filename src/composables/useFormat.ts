import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useFormat() {
  const { locale } = useI18n()

  const dateTimeFormatter = computed(() =>
    new Intl.DateTimeFormat(locale.value || 'es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  )

  function dateTime(value: string | number | Date) {
    const d = value instanceof Date ? value : new Date(value)
    return dateTimeFormatter.value.format(d)
  }

  return { dateTime }
}

