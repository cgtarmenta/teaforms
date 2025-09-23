<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppCard from '../../components/base/AppCard.vue'
import AppButton from '../../components/base/AppButton.vue'

type Field = { fieldId: string; label: string; type: string; required: boolean; options?: string[]; validation?: any }
type Form = { id: string; title: string }
const forms = ref<Form[]>([])
const formId = ref('')
const fields = ref<Field[]>([])
const model = ref<Record<string,any>>({})
const submitting = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string,any>>({})

async function loadForms() {
  const res = await fetch('/api/forms')
  if (res.ok) forms.value = await res.json()
  if (!formId.value && forms.value[0]) formId.value = forms.value[0].id
}
async function loadFields() {
  if (!formId.value) { fields.value=[]; return }
  const res = await fetch(`/api/forms/${formId.value}/fields`)
  fields.value = res.ok ? await res.json() : []
  const init: Record<string,any> = {}
  for (const f of fields.value) init[f.fieldId] = f.default ?? (f.type==='checkbox'?false:'')
  model.value = init
}
watch(formId, loadFields)

async function submit() {
  submitting.value = true
  error.value=''
  fieldErrors.value={}
  try {
    const res = await fetch('/api/episodes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ formId: formId.value, data: model.value }) })
    if (res.status===400) { const j=await res.json(); fieldErrors.value=j.errors||{}; throw new Error(j.error||'validation') }
    if (!res.ok) throw new Error('Failed')
    navigateTo('/episodes')
  } catch(e:any) { error.value = e?.message || 'Error' } finally { submitting.value=false }
}

onMounted(loadForms)
definePageMeta({ requiresAuth: true, roles: ['teacher','clinician','sysadmin'] })
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('episodesNew.title') }}</h1>
    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('episodes.form') }}</span>
          <select v-model="formId" class="w-full border rounded px-3 py-2">
            <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.title }}</option>
          </select>
        </label>
      </div>
    </AppCard>
    <section v-if="formId">
      <h2 class="text-xl font-semibold mb-3">{{ $t('formBuilder.fields') }}</h2>
      <div v-if="!fields.length" class="opacity-70">{{ $t('episodesNew.noFields') }}</div>
      <form v-else class="space-y-4" @submit.prevent="submit">
        <div v-for="f in fields" :key="f.fieldId" class="">
          <label class="block">
            <span class="block text-sm mb-1">{{ f.label }} <span v-if="f.required" class="text-red-600">*</span></span>
            <template v-if="f.type==='text'">
              <input v-model="model[f.fieldId]" class="w-full border rounded px-3 py-2" />
            </template>
            <template v-else-if="f.type==='textarea'">
              <textarea v-model="model[f.fieldId]" class="w-full border rounded px-3 py-2"></textarea>
            </template>
            <template v-else-if="f.type==='number'">
              <input type="number" v-model.number="model[f.fieldId]" class="w-full border rounded px-3 py-2" />
            </template>
            <template v-else-if="f.type==='date'">
              <input type="date" v-model="model[f.fieldId]" class="w-full border rounded px-3 py-2" />
            </template>
            <template v-else-if="f.type==='time'">
              <input type="time" v-model="model[f.fieldId]" class="w-full border rounded px-3 py-2" />
            </template>
            <template v-else-if="f.type==='select'">
              <select v-model="model[f.fieldId]" class="w-full border rounded px-3 py-2">
                <option v-for="opt in (f.options||[])" :key="String(opt)" :value="opt">{{ ['class','recess','lunch','hall','other'].includes(String(opt)) ? $t('contexts.' + String(opt)) : String(opt) }}</option>
              </select>
            </template>
            <template v-else-if="f.type==='radio'">
              <div class="flex flex-wrap gap-4">
                <label v-for="opt in (f.options||[])" :key="String(opt)" class="inline-flex items-center gap-2">
                  <input type="radio" :name="f.fieldId" :value="opt" v-model="model[f.fieldId]" />
                  <span>{{ ['class','recess','lunch','hall','other'].includes(String(opt)) ? $t('contexts.' + String(opt)) : String(opt) }}</span>
                </label>
              </div>
            </template>
            <template v-else-if="f.type==='checkbox'">
              <input type="checkbox" v-model="model[f.fieldId]" />
            </template>
          </label>
          <div v-if="fieldErrors[f.fieldId]" class="text-sm text-red-600">{{ fieldErrors[f.fieldId] }}</div>
        </div>
        <div class="pt-2 flex items-center gap-3">
          <AppButton :disabled="submitting" type="submit">{{ $t('episodesNew.create') }}</AppButton>
          <span v-if="error" class="text-red-600">{{ error }}</span>
        </div>
      </form>
    </section>
  </main>
</template>

