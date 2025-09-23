<script setup lang="ts">
defineProps<{ padding?: 'none'|'sm'|'md' }>()
</script>

<template>
  <div :class="['border border-slate-200 rounded bg-white shadow-sm', padding==='none'?'':(padding==='sm'?'p-3':'p-4')]">
    <slot />
  </div>
</template>

