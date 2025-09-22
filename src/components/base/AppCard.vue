<script setup lang="ts">
defineProps<{ as?: string; padding?: 'none' | 'sm' | 'md' }>()
</script>

<template>
  <component :is="as || 'div'" :class="[
    'border border-slate-200 rounded bg-white shadow-sm',
    padding === 'none' ? '' : (padding === 'sm' ? 'p-3' : 'p-4')
  ]">
    <slot />
  </component>
</template>

<style scoped>
</style>
