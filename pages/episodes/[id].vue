<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
const route = useRoute()
const id = route.params.id as string
const ep = ref<any>(null)
const fields = ref<any[]>([])
const { locale } = useI18n()
const dtf = computed(()=> new Intl.DateTimeFormat(locale.value, { dateStyle:'medium', timeStyle:'short' }))

async function load() {
  const r1 = await fetch(`/api/episodes/${id}`)
  if (r1.ok) ep.value = await r1.json()
  if (ep.value) {
    const r2 = await fetch(`/api/forms/${ep.value.formId}/fields`)
    fields.value = r2.ok ? await r2.json() : []
  }
}
onMounted(load)
definePageMeta({ requiresAuth: true, roles: ['teacher','clinician','sysadmin'] })

function display(f:any, v:any) {
  if (v==null || v==='') return ''
  if (f.type==='checkbox') return (v===true||v==='true'||v==='on') ? ($t('common.yes') as string) : ($t('common.no') as string)
  return String(v)
}
</script>


<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('episodesExtra.singular') }} {{ id }}</h1>
    <div v-if="!ep">…</div>
    <template v-else>
      <div class="opacity-70 mb-4">
        <div>{{ dtf.format(new Date(ep.timestamp)) }}</div>
        <div>{{ $t('episodes.context') }}: {{ $t('contexts.' + String(ep.context)) }}</div>
        <div v-if="ep.createdBy">{{ $t('commonExtra.by') }} {{ ep.createdBy }}</div>
      </div>
      <h2 class="text-xl font-semibold mb-2">{{ $t('formBuilder.fields') }}</h2>
      <div v-if="!fields.length" class="opacity-70">{{ $t('episodesNew.noFields') }}</div>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <template v-for="f in fields" :key="f.fieldId">
          <div class="border rounded p-3 bg-white">
            <dt class="text-xs opacity-60">{{ f.label }}</dt>
            <dd class="text-sm">{{ display(f, ep.data?.[f.fieldId]) }}</dd>
          </div>
        </template>
      </dl>
    </template>
  </main>
</template>

