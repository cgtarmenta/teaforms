<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = withDefaults(defineProps<{
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  block?: boolean
  disabled?: boolean
  ariaLabel?: string
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
})

const base = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[44px]'
const variants: Record<string,string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-700',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 focus-visible:ring-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-700',
  ghost: 'bg-transparent text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-700',
}
const sizes: Record<string,string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
}

const cls = computed(() => [
  base,
  variants[props.variant || 'primary'],
  sizes[props.size || 'md'],
  props.block ? 'w-full' : '',
  props.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
].join(' '))
</script>

<template>
  <RouterLink v-if="to" :to="to" :aria-label="ariaLabel" :class="cls"><slot /></RouterLink>
  <a v-else-if="href" :href="href" :aria-label="ariaLabel" :class="cls"><slot /></a>
  <button v-else :type="type" :disabled="disabled" :aria-label="ariaLabel" :class="cls"><slot /></button>
  
</template>

<style scoped>
</style>
