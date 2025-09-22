<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
import { useRoute } from 'vue-router'

type Field = {
  fieldId?: string
  label: string
  type: 'text'|'textarea'|'select'|'date'|'time'|'number'|'radio'|'checkbox'
  required: boolean
  options?: string[]
  default?: any
  validation?: { regex?: string; min?: number; max?: number; maxLength?: number }
  order?: number
}

const route = useRoute()
const formId = computed(() => route.params.id as string)
const fields = ref<Field[]>([])

const draft = ref<Field>({ label: '', type: 'text', required: false, options: [], validation: {} })
const editing = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

function resetDraft() {
  draft.value = { label: '', type: 'text', required: false, options: [], validation: {} }
}

async function load() {
  const res = await fetch(`/api/forms/${formId.value}/fields`)
  fields.value = await res.json()
}

async function addField() {
  error.value = ''
  loading.value = true
  try {
    const payload: Field = { ...draft.value }
    if (payload.type === 'select' || payload.type === 'radio') {
      payload.options = (payload.options || []).filter(Boolean)
    } else {
      delete payload.options
    }
    const res = await fetch(`/api/forms/${formId.value}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to create field')
    resetDraft()
    await load()
  } catch (e:any) {
    error.value = e?.message || 'Error'
  } finally {
    loading.value = false
  }
}

async function saveField(fieldId: string, patch: Partial<Field>) {
  const res = await fetch(`/api/forms/${formId.value}/fields/${fieldId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (res.ok) await load()
}

async function removeField(fieldId: string) {
  if (!confirm('Remove this field?')) return
  const res = await fetch(`/api/forms/${formId.value}/fields/${fieldId}`, { method: 'DELETE' })
  if (res.ok) await load()
}

function move(fieldId: string, dir: -1 | 1) {
  const idx = fields.value.findIndex((f) => f.fieldId === fieldId)
  if (idx === -1) return
  const newIdx = Math.max(0, Math.min(fields.value.length - 1, idx + dir))
  if (newIdx === idx) return
  const copy = fields.value.slice().sort((a,b)=>(a.order||0)-(b.order||0))
  const [item] = copy.splice(idx,1)
  copy.splice(newIdx,0,item)
  // reassign order
  copy.forEach((f,i)=>{ f.order = i+1 })
  Promise.all(copy.map((f)=> saveField(f.fieldId!, { order: f.order }))).then(load)
}

onMounted(load)
</script>

<template>
  <main class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{$t('formBuilder.title')}}</h1>
    <p class="opacity-70 mb-6">ID: <code>{{ formId }}</code></p>

    <AppCard class="mb-8">
      <h2 class="text-xl font-semibold mb-3">{{$t('formBuilder.addField')}}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label class="block">
          <span class="block text-sm mb-1">{{$t('formBuilder.label')}}</span>
          <input v-model="draft.label" class="w-full border rounded px-3 py-2" placeholder="e.g., Context" />
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{$t('formBuilder.type')}}</span>
          <select v-model="draft.type" class="w-full border rounded px-3 py-2">
            <option value="text">text</option>
            <option value="textarea">textarea</option>
            <option value="select">select</option>
            <option value="radio">radio</option>
            <option value="checkbox">checkbox</option>
            <option value="number">number</option>
            <option value="date">date</option>
            <option value="time">time</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{$t('formBuilder.required')}}</span>
          <input type="checkbox" v-model="draft.required" />
        </label>
        <label v-if="draft.type==='select' || draft.type==='radio'" class="block md:col-span-2">
          <span class="block text-sm mb-1">{{$t('formBuilder.options')}}</span>
          <input :value="(draft.options||[]).join(', ')" @input="(e:any)=> draft.options = e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)" class="w-full border rounded px-3 py-2" placeholder="class, recess, lunch, hall, other" />
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{$t('formBuilder.def')}}</span>
          <input v-model="(draft as any).default" class="w-full border rounded px-3 py-2" />
        </label>
        <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
          <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.min')}}</span><input v-model.number="(draft.validation as any).min" type="number" class="w-full border rounded px-3 py-2" /></label>
          <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.max')}}</span><input v-model.number="(draft.validation as any).max" type="number" class="w-full border rounded px-3 py-2" /></label>
          <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.maxLength')}}</span><input v-model.number="(draft.validation as any).maxLength" type="number" class="w-full border rounded px-3 py-2" /></label>
          <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.regex')}}</span><input v-model="(draft.validation as any).regex" class="w-full border rounded px-3 py-2" placeholder="^.{1,200}$" /></label>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <AppButton :disabled="loading || !draft.label" @click="addField">{{$t('formBuilder.addField')}}</AppButton>
        <span v-if="error" class="text-red-600">{{ error }}</span>
      </div>
    </AppCard>

    <section>
      <h2 class="text-xl font-semibold mb-3">{{$t('formBuilder.fields')}}</h2>
      <div v-if="!fields.length" class="opacity-70">{{$t('formBuilder.none')}}</div>
      <AppCard v-else padding="none">
        <ul class="divide-y">
          <li v-for="f in fields"
              :key="f.fieldId"
              class="p-3 md:grid md:grid-cols-12 md:items-center gap-3"
              draggable="true"
              @dragstart="(e:any)=>{ e.dataTransfer.setData('text/plain', f.fieldId) }"
              @dragover.prevent
              @drop="(e:any)=>{ const src=e.dataTransfer.getData('text/plain'); if(src && src!==f.fieldId){ move(src, fields.findIndex(x=>x.fieldId===f.fieldId) - fields.findIndex(x=>x.fieldId===src) > 0 ? 1 : -1) } }"
          >
            <div class="md:col-span-7">
              <div class="font-medium">{{ f.label }}</div>
              <div class="text-xs opacity-70">{{ f.type }} • {{ f.required ? 'required' : 'optional' }}</div>
            </div>
            <div class="flex flex-wrap gap-2 md:col-span-3 md:justify-start mt-2 md:mt-0">
              <AppButton size="sm" variant="ghost" @click="move(f.fieldId!, -1)">↑ {{$t('formBuilder.up')}}</AppButton>
              <AppButton size="sm" variant="ghost" @click="move(f.fieldId!, 1)">↓ {{$t('formBuilder.down')}}</AppButton>
            </div>
            <div class="flex flex-wrap gap-2 md:col-span-2 md:justify-end mt-2 md:mt-0">
              <AppButton size="sm" variant="ghost" @click="editing = editing === f.fieldId ? null : f.fieldId">{{ editing === f.fieldId ? 'Close' : $t('formBuilder.edit') }}</AppButton>
              <AppButton size="sm" variant="danger" @click="removeField(f.fieldId!)">{{$t('formBuilder.remove')}}</AppButton>
            </div>
            <div v-if="editing === f.fieldId" class="md:col-span-12 p-3 border-t bg-white mt-2">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.label')}}</span><input :value="f.label" @change="(e:any)=> saveField(f.fieldId!, { label: e.target.value })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.required')}}</span><input type="checkbox" :checked="f.required" @change="(e:any)=> saveField(f.fieldId!, { required: !!e.target.checked })" /></label>
                <label v-if="f.type==='select' || f.type==='radio'" class="block md:col-span-3"><span class="block text-sm mb-1">{{$t('formBuilder.options')}}</span><input :value="(f.options||[]).join(', ')" @change="(e:any)=> saveField(f.fieldId!, { options: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.def')}}</span><input :value="(f as any).default" @change="(e:any)=> saveField(f.fieldId!, { default: e.target.value })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.min')}}</span><input type="number" :value="(f.validation as any)?.min" @change="(e:any)=> saveField(f.fieldId!, { validation: { ...(f.validation||{}), min: Number(e.target.value) } })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.max')}}</span><input type="number" :value="(f.validation as any)?.max" @change="(e:any)=> saveField(f.fieldId!, { validation: { ...(f.validation||{}), max: Number(e.target.value) } })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block"><span class="block text-sm mb-1">{{$t('formBuilder.maxLength')}}</span><input type="number" :value="(f.validation as any)?.maxLength" @change="(e:any)=> saveField(f.fieldId!, { validation: { ...(f.validation||{}), maxLength: Number(e.target.value) } })" class="w-full border rounded px-3 py-2" /></label>
                <label class="block md:col-span-3"><span class="block text-sm mb-1">{{$t('formBuilder.regex')}}</span><input :value="(f.validation as any)?.regex || ''" @change="(e:any)=> saveField(f.fieldId!, { validation: { ...(f.validation||{}), regex: e.target.value } })" class="w-full border rounded px-3 py-2" /></label>
              </div>
            </div>
          </li>
        </ul>
      </AppCard>
    </section>
  </main>
</template>

<style scoped>
</style>
