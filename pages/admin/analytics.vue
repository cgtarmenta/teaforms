<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppCard from '../../components/base/AppCard.vue'

type Episode = { id:string; formId:string; context:string }
type Form = { id:string; title:string }
const episodes = ref<Episode[]>([])
const forms = ref<Form[]>([])

async function load() {
  const [eRes, fRes] = await Promise.all([
    fetch('/api/episodes?all=true'),
    fetch('/api/forms'),
  ])
  if (eRes.ok) { const j = await eRes.json(); episodes.value = j.items || [] }
  if (fRes.ok) forms.value = await fRes.json()
}

const total = computed(()=> episodes.value.length)
const formMap = computed(()=> Object.fromEntries(forms.value.map(f=>[f.id, f.title])))
const byForm = computed(()=> {
  const m: Record<string, number> = {}
  for (const e of episodes.value) m[e.formId] = (m[e.formId]||0) + 1
  return Object.entries(m).sort((a,b)=> b[1]-a[1])
})
const byContext = computed(()=> {
  const m: Record<string, number> = {}
  for (const e of episodes.value) m[e.context||'other'] = (m[e.context||'other']||0) + 1
  return Object.entries(m).sort((a,b)=> b[1]-a[1])
})

onMounted(load)
definePageMeta({ requiresAuth: true, roles: ['sysadmin'] })
</script>


<template>
  <main class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('admin.analytics') }}</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <AppCard class="text-center"><div class="text-sm opacity-70">{{ $t('admin.totalEpisodes') }}</div><div class="text-2xl font-semibold">{{ total }}</div></AppCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AppCard>
        <h2 class="font-semibold mb-2">{{ $t('admin.byForm') }}</h2>
        <ul class="divide-y border rounded">
          <li v-for="(entry, idx) in byForm" :key="idx" class="p-2 flex justify-between"><span>{{ formMap[entry[0]] || entry[0] }}</span><span>{{ entry[1] }}</span></li>
        </ul>
      </AppCard>
      <AppCard>
        <h2 class="font-semibold mb-2">{{ $t('admin.byContext') }}</h2>
        <ul class="divide-y border rounded">
          <li v-for="(entry, idx) in byContext" :key="idx" class="p-2 flex justify-between"><span>{{ $t('contexts.' + entry[0]) }}</span><span>{{ entry[1] }}</span></li>
        </ul>
      </AppCard>
    </div>
  </main>
  
</template>

