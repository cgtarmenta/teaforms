<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    :aria-label="ariaLabel"
    :aria-pressed="selected"
    :disabled="disabled"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Header -->
    <div v-if="hasHeader" class="px-4 py-5 sm:px-6 border-b border-gray-200">
      <slot name="header">
        <div class="flex items-center justify-between">
          <h3 v-if="title" class="text-lg font-medium leading-6 text-gray-900">
            {{ title }}
          </h3>
          <div v-if="hasActions" class="flex space-x-3">
            <slot name="actions" />
          </div>
        </div>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <!-- Body -->
    <div :class="bodyClasses">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="hasFooter" class="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue'

// Props
const props = defineProps({
  // Content
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  
  // Appearance
  variant: {
    type: String as PropType<'default' | 'bordered' | 'elevated' | 'flat'>,
    default: 'default'
  },
  padding: {
    type: String as PropType<'none' | 'sm' | 'md' | 'lg' | 'xl'>,
    default: 'md'
  },
  rounded: {
    type: String as PropType<'none' | 'sm' | 'md' | 'lg' | 'xl'>,
    default: 'lg'
  },
  
  // State
  clickable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  
  // Behavior
  hoverable: {
    type: Boolean,
    default: false
  },
  
  // Accessibility
  ariaLabel: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Slots
const slots = useSlots()

// Computed
const hasHeader = computed(() => props.title || props.subtitle || slots.header || slots.actions)
const hasFooter = computed(() => slots.footer)
const hasActions = computed(() => slots.actions)

const cardClasses = computed(() => {
  const classes = [
    'relative overflow-hidden transition-all duration-200'
  ]
  
  // Variant classes
  const variantClasses = {
    default: 'bg-white shadow',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    flat: 'bg-gray-50'
  }
  classes.push(variantClasses[props.variant])
  
  // Rounded classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  }
  classes.push(roundedClasses[props.rounded])
  
  // Interactive states
  if (props.clickable) {
    classes.push(
      'cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )
    
    if (!props.disabled) {
      classes.push('hover:shadow-lg active:scale-[0.98]')
    }
  } else if (props.hoverable && !props.disabled) {
    classes.push('hover:shadow-lg')
  }
  
  // Selected state
  if (props.selected) {
    classes.push('ring-2 ring-primary-500')
  }
  
  // Full width on mobile
  classes.push('w-full')
  
  return classes
})

const bodyClasses = computed(() => {
  const classes = []
  
  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  }
  classes.push(paddingClasses[props.padding])
  
  return classes
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>