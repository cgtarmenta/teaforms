<script setup lang="ts">
const props = withDefaults(defineProps<{ id?: string; label?: string; type?: string; placeholder?: string; modelValue?: string|number; required?: boolean; error?: string; autocomplete?: string }>(), { type:'text', placeholder:'', required:false, autocomplete:'off' })
const emit = defineEmits<{ (e:'update:modelValue', v:any):void }>()
</script>

<template>
  <label v-if="label" :for="id" class="block text-sm mb-1">{{ label }} <span v-if="required" class="text-red-600">*</span></label>
  <input :id="id" :type="type" :value="modelValue as any" :placeholder="placeholder" :required="required" :autocomplete="autocomplete" class="w-full border rounded px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-600" @input="(e:any)=>emit('update:modelValue', e.target.value)" />
  <p v-if="error" class="text-sm text-red-600 mt-1">{{ error }}</p>
</template>

