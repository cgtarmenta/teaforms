<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'

type Field = {
  fieldId: string
  label: string
  type: 'text'|'textarea'|'select'|'date'|'time'|'number'|'radio'|'checkbox'
  required: boolean
  options?: string[]
  default?: any
  validation?: { regex?: string; min?: number; max?: number; maxLength?: number }
  order?: number
}

type Form = { id: string; title: string }

const router = useRouter()
const { t } = useI18n()
const forms = ref<Form[]>([])
const formId = ref<string>('')
const fields = ref<Field[]>([])
const model = ref<Record<string, any>>({})
const submitting = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, any>>({})

async function loadForms() {
  const res = await fetch('/api/forms')
  forms.value = await res.json()
  if (!formId.value && forms.value[0]) formId.value = forms.value[0].id
}

async function loadFields(fid: string) {
  if (!fid) { fields.value = []; return }
  const res = await fetch(`/api/forms/${fid}/fields`)
  fields.value = await res.json()
  const init: Record<string, any> = {}
  for (const f of fields.value) {
    init[f.fieldId] = f.default ?? (f.type === 'checkbox' ? false : '')
  }
  model.value = init
}

watch(formId, (v) => loadFields(v))

function validateClient(): boolean {
  const errs: Record<string, any> = {}
  for (const f of fields.value) {
    const v = model.value[f.fieldId]
    if (f.required && (v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))) {
      errs[f.fieldId] = { code: 'required' }
      continue
    }
    if (v == null) continue
    switch (f.type) {
      case 'number': {
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isNaN(num)) { errs[f.fieldId] = { code: 'number' }; break }
        const min = (f.validation as any)?.min
        const max = (f.validation as any)?.max
        if (min != null && num < min) errs[f.fieldId] = { code: 'min', value: min }
        if (max != null && num > max) errs[f.fieldId] = { code: 'max', value: max }
        break
      }
      case 'text':
      case 'textarea': {
        const s = String(v)
        const maxLength = (f.validation as any)?.maxLength
        if (maxLength != null && s.length > maxLength) errs[f.fieldId] = { code: 'maxLength', value: maxLength }
        const regex = (f.validation as any)?.regex
        if (regex) { try { const re = new RegExp(regex); if (!re.test(s)) errs[f.fieldId] = { code: 'regex' } } catch {} }
        break
      }
      case 'select':
      case 'radio': {
        if (Array.isArray(f.options) && f.options.length && !f.options.includes(v)) errs[f.fieldId] = { code: 'option' }
        break
      }
      case 'checkbox': {
        if (!(typeof v === 'boolean' || v === 'on' || v === 'true' || v === 'false')) errs[f.fieldId] = { code: 'boolean' }
        break
      }
    }
  }
  fieldErrors.value = errs
  return Object.keys(errs).length === 0
}

async function submit() {
  error.value = ''
  fieldErrors.value = {}
  submitting.value = true
  try {
    if (!validateClient()) throw new Error('validation')
    const payload = { formId: formId.value, data: model.value }
    const res = await fetch('/api/episodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 400) {
      const j = await res.json()
      if (j?.errors) fieldErrors.value = j.errors
      throw new Error(j?.error || 'Validation error')
    }
    if (!res.ok) throw new Error('Failed to create episode')
    router.push('/episodes')
  } catch (e:any) {
    error.value = e?.message || 'Error'
  } finally {
    submitting.value = false
  }
}

onMounted(loadForms)
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{$t('episodesNew.title')}}</h1>

    <AppCard class="mb-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
      <label class="block">
        <span class="block text-sm mb-1">{{$t('episodes.form')}}</span>
        <select v-model="formId" class="w-full border rounded px-3 py-2">
          <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.title }}</option>
        </select>
      </label>
    </div>
    </AppCard>

    <section v-if="formId">
      <h2 class="text-xl font-semibold mb-3">{{$t('formBuilder.fields')}}</h2>
      <div v-if="!fields.length" class="opacity-70">{{$t('episodesNew.noFields')}}</div>
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
                <option v-for="opt in (f.options||[])" :key="String(opt)" :value="opt">{{ ['class','recess','lunch','hall','other'].includes(String(opt)) ? t('contexts.' + String(opt)) : String(opt) }}</option>
              </select>
            </template>
            <template v-else-if="f.type==='radio'">
              <div class="flex flex-wrap gap-4">
                <label v-for="opt in (f.options||[])" :key="String(opt)" class="inline-flex items-center gap-2">
                  <input type="radio" :name="f.fieldId" :value="opt" v-model="model[f.fieldId]" />
                  <span>{{ ['class','recess','lunch','hall','other'].includes(String(opt)) ? t('contexts.' + String(opt)) : String(opt) }}</span>
                </label>
              </div>
            </template>
            <template v-else-if="f.type==='checkbox'">
              <input type="checkbox" v-model="model[f.fieldId]" />
            </template>
          </label>
          <div class="text-xs opacity-70 mt-1">
            <span v-if="f.validation?.min != null">min: {{ f.validation.min }}</span>
            <span v-if="f.validation?.max != null" class="ml-2">max: {{ f.validation.max }}</span>
            <span v-if="f.validation?.maxLength != null" class="ml-2">maxLength: {{ f.validation.maxLength }}</span>
            <span v-if="f.validation?.regex" class="ml-2">regex: {{ f.validation.regex }}</span>
          </div>
          <div v-if="fieldErrors[f.fieldId]" class="text-sm text-red-600">
            <template v-if="typeof fieldErrors[f.fieldId] === 'string'">
              {{ fieldErrors[f.fieldId] }}
            </template>
            <template v-else>
              {{$t('validation.' + fieldErrors[f.fieldId].code, { value: fieldErrors[f.fieldId].value })}}
            </template>
          </div>
        </div>
        <div class="pt-2 flex items-center gap-3">
          <AppButton :disabled="submitting" type="submit">{{$t('episodesNew.create')}}</AppButton>
          <span v-if="error" class="text-red-600">{{ error }}</span>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
</style>
