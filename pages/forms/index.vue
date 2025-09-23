<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppCard from '../../components/base/AppCard.vue'
import AppInput from '../../components/base/AppInput.vue'
import AppButton from '../../components/base/AppButton.vue'

type Form = { id: string; title: string; status: string; version: number }
const forms = ref<Form[]>([])
const title = ref('')
const loading = ref(false)

async function load() {
  try {
    const res = await fetch('/api/forms')
    if (res.ok) forms.value = await res.json()
  } catch {}
}

async function create() {
  if (!title.value) return
  loading.value = true
  try {
    const res = await fetch('/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.value }) })
    if (res.ok) { title.value=''; await load() }
  } finally { loading.value = false }
}

onMounted(load)
definePageMeta({ requiresAuth: true, roles: ['clinician','sysadmin'] })
</script>


<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('forms.title') }}</h1>
    <AppCard class="mb-6">
      <div class="flex flex-col md:flex-row gap-2">
        <AppInput v-model="title" :placeholder="$t('forms.newTitlePh') as string" />
        <AppButton :disabled="loading" @click="create">{{ $t('forms.add') }}</AppButton>
      </div>
    </AppCard>
    <ul class="divide-y border rounded bg-white">
      <li v-for="f in forms" :key="f.id" class="p-3 flex items-center justify-between">
        <div>
          <div class="font-medium">{{ f.title }}</div>
          <div class="text-sm opacity-70">{{ $t('forms.status') }}: {{ f.status }} • {{ $t('forms.version') }}{{ f.version }}</div>
        </div>
        <div class="flex gap-3 items-center">
          <AppButton variant="ghost" size="sm" :to="`/forms/${f.id}`">{{ $t('forms.edit') }}</AppButton>
          <AppButton variant="ghost" size="sm" :href="`/api/forms/${f.id}`" target="_blank">{{ $t('forms.raw') }}</AppButton>
        </div>
      </li>
    </ul>
  </main>
</template>

