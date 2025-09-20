<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform opacity-0 translate-y-2"
    enter-to-class="transform opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      v-if="isVisible"
      :class="alertClasses"
      role="alert"
      :aria-live="type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="flex">
        <!-- Icon -->
        <div v-if="showIcon" class="flex-shrink-0">
          <component :is="iconComponent" class="h-5 w-5" :class="iconColorClass" aria-hidden="true" />
        </div>

        <!-- Content -->
        <div class="flex-1" :class="{ 'ml-3': showIcon }">
          <!-- Title -->
          <h3 v-if="title" class="text-sm font-medium" :class="titleColorClass">
            {{ title }}
          </h3>
          
          <!-- Message -->
          <div class="text-sm" :class="[messageColorClass, { 'mt-2': title }]">
            <slot>
              {{ message }}
            </slot>
          </div>

          <!-- Actions -->
          <div v-if="hasActions" class="mt-3 flex space-x-3">
            <slot name="actions" />
          </div>
        </div>

        <!-- Close button -->
        <div v-if="dismissible" class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button
              type="button"
              :class="closeButtonClasses"
              @click="handleDismiss"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, useSlots, type PropType } from 'vue'

// Icon components (simplified - in real app, import from icon library)
const icons = {
  success: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>`
  },
  error: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>`
  },
  warning: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>`
  },
  info: {
    template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>`
  }
}

// Props
const props = defineProps({
  type: {
    type: String as PropType<'success' | 'error' | 'warning' | 'info'>,
    default: 'info'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  variant: {
    type: String as PropType<'filled' | 'tinted' | 'outlined'>,
    default: 'tinted'
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  autoClose: {
    type: Number,
    default: 0 // 0 means no auto close
  },
  modelValue: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'dismiss': []
  'closed': []
}>()

// State
const isVisible = ref(props.modelValue)

// Slots
const slots = useSlots()
const hasActions = computed(() => !!slots.actions)

// Computed
const alertClasses = computed(() => {
  const classes = ['rounded-lg p-4']
  
  // Variant and type classes
  if (props.variant === 'filled') {
    const filledClasses = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-600 text-white'
    }
    classes.push(filledClasses[props.type])
  } else if (props.variant === 'tinted') {
    const tintedClasses = {
      success: 'bg-green-50 text-green-800',
      error: 'bg-red-50 text-red-800',
      warning: 'bg-yellow-50 text-yellow-800',
      info: 'bg-blue-50 text-blue-800'
    }
    classes.push(tintedClasses[props.type])
  } else if (props.variant === 'outlined') {
    const outlinedClasses = {
      success: 'border-2 border-green-200 bg-white text-green-800',
      error: 'border-2 border-red-200 bg-white text-red-800',
      warning: 'border-2 border-yellow-200 bg-white text-yellow-800',
      info: 'border-2 border-blue-200 bg-white text-blue-800'
    }
    classes.push(outlinedClasses[props.type])
  }
  
  return classes
})

const iconColorClass = computed(() => {
  if (props.variant === 'filled') return 'text-white'
  
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }
  return colors[props.type]
})

const titleColorClass = computed(() => {
  if (props.variant === 'filled') return 'text-white'
  
  const colors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }
  return colors[props.type]
})

const messageColorClass = computed(() => {
  if (props.variant === 'filled') return 'text-white'
  
  const colors = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  }
  return colors[props.type]
})

const closeButtonClasses = computed(() => {
  const baseClasses = [
    'inline-flex rounded-md p-1.5',
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  ]
  
  if (props.variant === 'filled') {
    baseClasses.push(
      'text-white hover:bg-white hover:bg-opacity-20',
      'focus:ring-offset-transparent focus:ring-white'
    )
  } else {
    const colors = {
      success: 'text-green-500 hover:bg-green-100 focus:ring-green-600',
      error: 'text-red-500 hover:bg-red-100 focus:ring-red-600',
      warning: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
      info: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
    }
    baseClasses.push(colors[props.type])
  }
  
  return baseClasses
})

const iconComponent = computed(() => icons[props.type])

// Methods
const handleDismiss = () => {
  isVisible.value = false
  emit('dismiss')
  emit('update:modelValue', false)
  
  setTimeout(() => {
    emit('closed')
  }, 300) // After transition completes
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue
})

// Auto close
onMounted(() => {
  if (props.autoClose > 0) {
    setTimeout(() => {
      handleDismiss()
    }, props.autoClose)
  }
})
</script>