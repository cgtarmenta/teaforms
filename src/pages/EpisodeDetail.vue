<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat'

type Episode = { id: string; formId: string; timestamp: string; context: string; data?: Record<string, any>; createdBy?: string }
type Field = { fieldId: string; label: string; type: string; required: boolean; options?: string[]; order?: number }

const route = useRoute()
const { t } = useI18n()
const { dateTime } = useFormat()
const id = computed(() => route.params.id as string)
const ep = ref<Episode | null>(null)
const fields = ref<Field[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const r1 = await fetch(`/api/episodes/${id.value}`)
    if (r1.ok) ep.value = await r1.json()
    if (ep.value) {
      const r2 = await fetch(`/api/forms/${ep.value.formId}/fields`)
      fields.value = r2.ok ? await r2.json() : []
    }
  } finally {
    loading.value = false
  }
}

function displayValue(f: Field, v: any) {
  if (v == null || v === '') return ''
  switch (f.type) {
    case 'checkbox': return (v === true || v === 'true' || v === 'on') ? t('common.yes') : t('common.no')
    default: return String(v)
  }
}

onMounted(load)
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{$t('episodesExtra.singular')}} {{ id }}</h1>

    <div v-if="loading">…</div>
    <template v-else-if="ep">
      <div class="opacity-70 mb-4">
        <div>{{ dateTime(ep.timestamp) }}</div>
        <div>{{ $t('episodes.context') }}: {{$t('contexts.' + String(ep.context))}}</div>
        <div v-if="ep.createdBy">{{$t('commonExtra.by')}} {{ ep.createdBy }}</div>
      </div>

      <h2 class="text-xl font-semibold mb-2">{{$t('formBuilder.fields')}}</h2>
      <div v-if="!fields.length" class="opacity-70">{{$t('episodesNew.noFields')}}</div>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <template v-for="f in fields" :key="f.fieldId">
          <div class="border rounded p-3 bg-white">
            <dt class="text-xs opacity-60">{{ f.label }}</dt>
            <dd class="text-sm">{{ displayValue(f, ep.data?.[f.fieldId]) }}</dd>
          </div>
        </template>
      </dl>
    </template>
  </main>
</template>

<style scoped>
</style>
