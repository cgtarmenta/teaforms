<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormat } from '../composables/useFormat'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'

type Episode = { id: string; formId: string; timestamp: string; context: string; data?: Record<string, any> }
type Form = { id: string; title: string }
type Field = { fieldId: string; label: string; type: string; required: boolean; options?: string[]; order?: number }

const episodes = ref<Episode[]>([])
const forms = ref<Form[]>([])
const fieldsMap = ref<Record<string, Field[]>>({})
const formMap = computed(() => Object.fromEntries(forms.value.map(f => [f.id, f])))

const formId = ref('')
const context = ref('')
const from = ref('')
const to = ref('')
const loading = ref(false)
const { t } = useI18n()
const { dateTime } = useFormat()

async function load() {
  const qs = new URLSearchParams()
  if (formId.value) qs.set('formId', formId.value)
  if (context.value) qs.set('context', context.value)
  if (from.value) qs.set('from', from.value)
  if (to.value) qs.set('to', to.value)
  const [eRes, fRes] = await Promise.all([
    fetch('/api/episodes?' + qs.toString()),
    fetch('/api/forms'),
  ])
  episodes.value = await eRes.json()
  forms.value = await fRes.json()
  if (!formId.value && forms.value[0]) formId.value = forms.value[0].id
  // Load fields for unique formIds present in episodes
  const uniqueFormIds = Array.from(new Set(episodes.value.map(e => e.formId)))
  await Promise.all(uniqueFormIds.map(async (fid) => {
    if (!fieldsMap.value[fid]) {
      const r = await fetch(`/api/forms/${fid}/fields`)
      fieldsMap.value[fid] = await r.json()
    }
  }))
}

async function create() {
  if (!formId.value) return
  loading.value = true
  try {
    const res = await fetch('/api/episodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ formId: formId.value, context: context.value }) })
    if (res.ok) await load()
  } finally {
    loading.value = false
  }
}

function displaySummary(e: Episode): { label: string; value: string }[] {
  const fields = fieldsMap.value[e.formId] || []
  const data = e.data || {}
  const out: { label: string; value: string }[] = []
  for (const f of fields) {
    const v = data[f.fieldId]
    if (v === undefined || v === null || v === '') continue
    let s = ''
    switch (f.type) {
      case 'checkbox': s = (v === true || v === 'true' || v === 'on') ? 'Yes' : 'No'; break
      default: s = String(v); break
    }
    out.push({ label: f.label, value: s })
    if (out.length >= 3) break
  }
  if (out.length === 0) {
    const ctxLabel = t('episodes.context') as string
    const ctxValue = t('contexts.' + String(e.context)) as string
    out.push({ label: ctxLabel, value: ctxValue })
  }
  return out
}

onMounted(load)
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{$t('episodes.title')}}</h1>

    <AppCard class="mb-6">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
      <label class="block">
        <span class="block text-sm mb-1">{{$t('episodes.form')}}</span>
        <select v-model="formId" class="w-full border rounded px-3 py-2">
          <option v-for="f in forms" :value="f.id" :key="f.id">{{ f.title }}</option>
          <option value="">—</option>
        </select>
      </label>
      <label class="block">
        <span class="block text-sm mb-1">{{$t('episodes.context')}}</span>
        <select v-model="context" class="w-full border rounded px-3 py-2">
          <option value="">—</option>
          <option value="class">{{$t('contexts.class')}}</option>
          <option value="recess">{{$t('contexts.recess')}}</option>
          <option value="lunch">{{$t('contexts.lunch')}}</option>
          <option value="hall">{{$t('contexts.hall')}}</option>
          <option value="other">{{$t('contexts.other')}}</option>
        </select>
      </label>
      <label class="block">
        <span class="block text-sm mb-1">{{$t('export.from')}}</span>
        <input type="date" v-model="from" class="w-full border rounded px-3 py-2" />
      </label>
      <label class="block">
        <span class="block text-sm mb-1">{{$t('export.to')}}</span>
        <input type="date" v-model="to" class="w-full border rounded px-3 py-2" />
      </label>
      <div class="flex flex-wrap gap-2">
        <AppButton :disabled="loading" @click="load">{{$t('export.filter')}}</AppButton>
        <AppButton variant="secondary" :disabled="loading" @click="create">{{$t('episodes.quickCreate')}}</AppButton>
        <AppButton variant="secondary" :to="'/episodes/new'">{{$t('episodes.openBuilder')}}</AppButton>
        <AppButton variant="danger" @click="()=> window.open('/api/export/pdf?' + new URLSearchParams({ formId: formId || '', context: context || '', from: from || '', to: to || '' }).toString(), '_blank')">{{$t('export.pdf')}}</AppButton>
        <AppButton variant="danger" @click="()=> window.open('/api/export/xml?' + new URLSearchParams({ formId: formId || '', context: context || '', from: from || '', to: to || '' }).toString(), '_blank')">{{$t('export.xml')}}</AppButton>
      </div>
    </div>
    </AppCard>

    <ul class="divide-y border rounded bg-white">
      <li v-for="e in episodes" :key="e.id" class="p-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium">{{ formMap[e.formId]?.title || $t('episodesExtra.singular') }} • {{ e.id.slice(0,8) }}</div>
            <div class="text-sm opacity-70">{{ dateTime(e.timestamp) }}</div>
          </div>
          <a class="underline" :href="'/api/episodes/' + e.id" target="_blank">{{$t('common.raw')}}</a>
          <router-link class="underline" :to="'/episodes/' + e.id">{{$t('commonExtra.view')}}</router-link>
        </div>
        <dl class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <template v-for="pair in displaySummary(e)" :key="pair.label">
            <div class="border rounded p-2 bg-white">
              <dt class="text-xs opacity-60">{{ pair.label }}</dt>
              <dd class="text-sm">{{ pair.value }}</dd>
            </div>
          </template>
        </dl>
      </li>
    </ul>
  </main>
</template>

<style scoped>
</style>
