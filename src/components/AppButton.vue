<template>
  <component
    :is="computedTag"
    :type="type"
    :to="to"
    :href="href"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-pressed="pressed"
    :aria-expanded="expanded"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="mr-2">
      <svg 
        class="animate-spin h-4 w-4"
        :class="loadingIconColor"
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>

    <!-- Icon before text -->
    <span v-if="icon && iconPosition === 'before' && !loading" class="mr-2">
      <component :is="icon" class="h-5 w-5" aria-hidden="true" />
    </span>

    <!-- Button text -->
    <span :class="{ 'sr-only': iconOnly }">
      <slot>{{ label }}</slot>
    </span>

    <!-- Icon after text -->
    <span v-if="icon && iconPosition === 'after' && !loading" class="ml-2">
      <component :is="icon" class="h-5 w-5" aria-hidden="true" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { RouterLink } from 'vue-router'

// Props
const props = defineProps({
  // Content
  label: {
    type: String,
    default: ''
  },
  
  // Appearance
  variant: {
    type: String as PropType<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>,
    default: 'primary'
  },
  size: {
    type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl'>,
    default: 'md'
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: String as PropType<'none' | 'sm' | 'md' | 'lg' | 'full'>,
    default: 'md'
  },
  
  // State
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  pressed: {
    type: Boolean,
    default: undefined
  },
  expanded: {
    type: Boolean,
    default: undefined
  },
  
  // Icon
  icon: {
    type: [Object, String],
    default: null
  },
  iconPosition: {
    type: String as PropType<'before' | 'after'>,
    default: 'before'
  },
  iconOnly: {
    type: Boolean,
    default: false
  },
  
  // Link/Router
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },
  
  // Form
  type: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button'
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

// Computed
const computedTag = computed(() => {
  if (props.to) return RouterLink
  if (props.href) return 'a'
  return 'button'
})

const buttonClasses = computed(() => {
  const classes = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'touch-target' // Minimum 44x44px touch target
  ]
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }
  classes.push(sizeClasses[props.size])
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
  }
  classes.push(variantClasses[props.variant])
  
  // Rounded classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
  classes.push(roundedClasses[props.rounded])
  
  // Full width
  if (props.fullWidth) {
    classes.push('w-full')
  }
  
  // Icon only - make it square
  if (props.iconOnly) {
    classes.push('!p-2')
  }
  
  return classes
})

const loadingIconColor = computed(() => {
  if (props.variant === 'outline' || props.variant === 'ghost') {
    return 'text-gray-700'
  }
  return 'text-white'
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>