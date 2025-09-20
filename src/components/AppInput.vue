<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label 
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-label="requerido">*</span>
    </label>

    <!-- Input wrapper with icon support -->
    <div class="relative">
      <!-- Leading icon -->
      <div v-if="leadingIcon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <component :is="leadingIcon" class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>

      <!-- Input or Textarea -->
      <component
        :is="inputTag"
        :id="inputId"
        ref="inputRef"
        v-model="internalValue"
        :type="type"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :min="min"
        :max="max"
        :step="step"
        :minlength="minlength"
        :maxlength="maxlength"
        :pattern="pattern"
        :rows="rows"
        :aria-label="ariaLabel"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <!-- Trailing icon or clear button -->
      <div v-if="trailingIcon || (clearable && internalValue)" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <!-- Clear button -->
        <button
          v-if="clearable && internalValue"
          type="button"
          class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
          :aria-label="`Limpiar ${label || 'campo'}`"
          @click="handleClear"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <!-- Trailing icon -->
        <component 
          v-else-if="trailingIcon" 
          :is="trailingIcon" 
          class="h-5 w-5 text-gray-400 pointer-events-none" 
          aria-hidden="true" 
        />
      </div>

      <!-- Character count -->
      <div v-if="showCharacterCount && maxlength" class="absolute right-2 -bottom-6 text-xs text-gray-500">
        {{ characterCount }}/{{ maxlength }}
      </div>
    </div>

    <!-- Helper text -->
    <p 
      v-if="helperText && !error"
      :id="`${inputId}-helper`"
      class="mt-1 text-sm text-gray-500"
    >
      {{ helperText }}
    </p>

    <!-- Error message -->
    <p 
      v-if="error"
      :id="`${inputId}-error`"
      class="mt-1 text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, type PropType } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  
  // Field attributes
  type: {
    type: String as PropType<'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'>,
    default: 'text'
  },
  name: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  
  // Validation
  required: {
    type: Boolean,
    default: false
  },
  min: {
    type: [String, Number],
    default: undefined
  },
  max: {
    type: [String, Number],
    default: undefined
  },
  step: {
    type: [String, Number],
    default: undefined
  },
  minlength: {
    type: Number,
    default: undefined
  },
  maxlength: {
    type: Number,
    default: undefined
  },
  pattern: {
    type: String,
    default: undefined
  },
  
  // State
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  
  // Appearance
  size: {
    type: String as PropType<'xs' | 'sm' | 'md' | 'lg'>,
    default: 'md'
  },
  rounded: {
    type: String as PropType<'none' | 'sm' | 'md' | 'lg' | 'full'>,
    default: 'md'
  },
  fullWidth: {
    type: Boolean,
    default: true
  },
  
  // Icons
  leadingIcon: {
    type: [Object, String],
    default: null
  },
  trailingIcon: {
    type: [Object, String],
    default: null
  },
  
  // Features
  clearable: {
    type: Boolean,
    default: false
  },
  showCharacterCount: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  
  // Textarea
  textarea: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 3
  },
  
  // Helper
  helperText: {
    type: String,
    default: ''
  },
  
  // Accessibility
  ariaLabel: {
    type: String,
    default: null
  },
  ariaDescribedby: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'input': [value: string | number]
  'change': [value: string | number]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
  'keydown': [event: KeyboardEvent]
  'clear': []
}>()

// Refs
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

// State
const internalValue = ref(props.modelValue)
const isFocused = ref(false)

// Computed
const inputTag = computed(() => props.textarea ? 'textarea' : 'input')

const hasError = computed(() => !!props.error)

const characterCount = computed(() => String(internalValue.value).length)

const wrapperClasses = computed(() => {
  const classes = []
  if (props.fullWidth) {
    classes.push('w-full')
  }
  if (props.showCharacterCount && props.maxlength) {
    classes.push('mb-6') // Space for character count
  }
  return classes
})

const inputClasses = computed(() => {
  const classes = [
    'block w-full border shadow-sm transition-colors duration-200',
    'placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed'
  ]
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  classes.push(sizeClasses[props.size])
  
  // Rounded classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
  classes.push(roundedClasses[props.rounded])
  
  // Padding for icons
  if (props.leadingIcon) {
    classes.push('pl-10')
  }
  if (props.trailingIcon || props.clearable) {
    classes.push('pr-10')
  }
  
  // Error state
  if (hasError.value) {
    classes.push('border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500')
  } else {
    classes.push('border-gray-300 text-gray-900')
  }
  
  return classes
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
  emit('input', newValue)
})

// Methods
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = props.type === 'number' ? Number(target.value) : target.value
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  emit('change', internalValue.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleClear = () => {
  internalValue.value = ''
  emit('clear')
  inputRef.value?.focus()
}

// Public methods
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

// Lifecycle
onMounted(() => {
  if (props.autofocus) {
    focus()
  }
})

// Expose public methods
defineExpose({
  focus,
  blur,
  inputRef
})
</script>