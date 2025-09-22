<script setup lang="ts">
type Option = { value: string | number; label: string }
const props = withDefaults(defineProps<{
  id?: string
  label?: string
  modelValue?: string | number
  options?: Option[]
  required?: boolean
  error?: string
}>(), {
  options: () => [],
  required: false,
})
const emit = defineEmits<{ (e: 'update:modelValue', value: any): void }>()
</script>

<template>
  <label v-if="label" class="block text-sm mb-1" :for="id">{{ label }} <span v-if="required" class="text-red-600">*</span></label>
  <select :id="id" :value="modelValue as any" class="w-full border rounded px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-600"
    @change="(e:any) => emit('update:modelValue', e.target.value)">
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
  </select>
  <p v-if="error" class="text-sm text-red-600 mt-1">{{ error }}</p>
</template>

<style scoped>
</style>
