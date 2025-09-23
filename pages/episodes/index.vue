<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCard from '../../components/base/AppCard.vue'
import AppButton from '../../components/base/AppButton.vue'

type Episode = { id: string; formId: string; timestamp: string; context: string; data?: Record<string, any> }
type Form = { id: string; title: string }

const { t, locale } = useI18n()
const episodes = ref<Episode[]>([])
const forms = ref<Form[]>([])
const formId = ref('')
const context = ref('')
const from = ref('')
const to = ref('')
const loading = ref(false)

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sort = ref<'timestamp'|'formId'|'context'|'createdBy'>('timestamp')
const order = ref<'asc'|'desc'>('desc')
const dtf = computed(()=> new Intl.DateTimeFormat(locale.value, { dateStyle:'medium', timeStyle:'short' }))

async function load() {
  const qs = new URLSearchParams()
  if (formId.value) qs.set('formId', formId.value)
  if (context.value) qs.set('context', context.value)
  if (from.value) qs.set('from', from.value)
  if (to.value) qs.set('to', to.value)
  if (sort.value) qs.set('sort', sort.value)
  if (order.value) qs.set('order', order.value)
  qs.set('page', String(page.value))
  qs.set('pageSize', String(pageSize.value))
  const [eRes, fRes] = await Promise.all([
    fetch('/api/episodes?' + qs.toString()),
    fetch('/api/forms'),
  ])
  if (eRes.ok) { const j = await eRes.json(); episodes.value = j.items || []; total.value = j.total || 0 }
  if (fRes.ok) forms.value = await fRes.json()
}

async function createQuick() {
  if (!formId.value) return
  loading.value = true
  try {
    const res = await fetch('/api/episodes', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ formId: formId.value, context: context.value || 'other' }) })
    if (res.ok) await load()
  } finally { loading.value=false }
}

onMounted(load)
definePageMeta({ requiresAuth: true, roles: ['teacher','clinician','sysadmin'] })
</script>


<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('episodes.title') }}</h1>
    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('episodes.form') }}</span>
          <select v-model="formId" class="w-full border rounded px-3 py-2">
            <option value="">—</option>
            <option v-for="f in forms" :value="f.id" :key="f.id">{{ f.title }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('episodes.context') }}</span>
          <select v-model="context" class="w-full border rounded px-3 py-2">
            <option value="">—</option>
            <option value="class">{{ $t('contexts.class') }}</option>
            <option value="recess">{{ $t('contexts.recess') }}</option>
            <option value="lunch">{{ $t('contexts.lunch') }}</option>
            <option value="hall">{{ $t('contexts.hall') }}</option>
            <option value="other">{{ $t('contexts.other') }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('episodes.sort') }}</span>
          <select v-model="sort" @change="load" class="w-full border rounded px-3 py-2">
            <option value="timestamp">{{ $t('episodes.sortTimestamp') }}</option>
            <option value="formId">{{ $t('episodes.sortForm') }}</option>
            <option value="context">{{ $t('episodes.sortContext') }}</option>
            <option value="createdBy">{{ $t('episodes.sortAuthor') }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('episodes.order') }}</span>
          <select v-model="order" @change="load" class="w-full border rounded px-3 py-2">
            <option value="desc">{{ $t('episodes.desc') }}</option>
            <option value="asc">{{ $t('episodes.asc') }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('export.from') }}</span>
          <input type="date" v-model="from" class="w-full border rounded px-3 py-2" />
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('export.to') }}</span>
          <input type="date" v-model="to" class="w-full border rounded px-3 py-2" />
        </label>
        <div class="flex flex-wrap gap-2">
          <AppButton :disabled="loading" @click="load">{{ $t('export.filter') }}</AppButton>
          <AppButton variant="secondary" :disabled="loading" @click="createQuick">{{ $t('episodes.quickCreate') }}</AppButton>
          <AppButton variant="secondary" to="/episodes/new">{{ $t('episodes.openBuilder') }}</AppButton>
        </div>
      </div>
    </AppCard>

    <ul class="divide-y border rounded bg-white">
      <li v-for="e in episodes" :key="e.id" class="p-3 flex items-center justify-between gap-4">
        <div>
          <div class="font-medium">{{ e.formId }} • {{ e.id.slice(0,8) }}</div>
          <div class="text-sm opacity-70">{{ dtf.format(new Date(e.timestamp)) }}</div>
        </div>
        <NuxtLink class="underline" :to="`/episodes/${e.id}`">{{ $t('commonExtra.view') || 'View' }}</NuxtLink>
      </li>
    </ul>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm opacity-70">{{ total }} total</div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" size="sm" :disabled="page<=1" @click="page=Math.max(1,page-1); load()">Prev</AppButton>
        <span>Page {{ page }}</span>
        <AppButton variant="secondary" size="sm" :disabled="(page*pageSize)>=total" @click="page=page+1; load()">Next</AppButton>
      </div>
    </div>
  </main>
  </template>

