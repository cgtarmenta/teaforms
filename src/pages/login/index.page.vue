<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and title -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Registro de Episodios
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Inicia sesión para continuar
        </p>
      </div>

      <!-- Login form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <!-- Email input -->
          <div>
            <label for="email" class="sr-only">Correo electrónico</label>
            <input
              id="email"
              v-model="formData.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Correo electrónico"
              :disabled="isLoading"
            />
          </div>
          
          <!-- Password input -->
          <div>
            <label for="password" class="sr-only">Contraseña</label>
            <input
              id="password"
              v-model="formData.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Remember me -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="formData.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Recordarme
            </label>
          </div>

          <div class="text-sm">
            <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">
                {{ error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </span>
            <span v-else>Iniciar sesión</span>
          </button>
        </div>
      </form>

      <!-- Development mode info -->
      <div v-if="isDevelopment" class="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 class="text-sm font-medium text-yellow-800 mb-2">Modo desarrollo</h3>
        <p class="text-xs text-yellow-700 mb-2">Usa cualquiera de estas credenciales:</p>
        <ul class="text-xs text-yellow-700 space-y-1">
          <li>• admin@teaforms.local / dev123 (Administrador)</li>
          <li>• clinician@test.com / dev123 (Médico)</li>
          <li>• teacher@test.com / dev123 (Docente)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { navigateTo } from 'vite-plugin-ssr/client/router'

// State
const isLoading = ref(false)
const error = ref('')
const isDevelopment = ref(import.meta.env.DEV)

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// Methods
const handleLogin = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const endpoint = isDevelopment.value ? '/api/auth/login/local' : '/api/auth/login'
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      }),
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Error al iniciar sesión'
      return
    }

    // Store user data if needed
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    // Redirect based on role
    const role = data.user?.role
    if (role === 'sysadmin') {
      await navigateTo('/dashboard')
    } else if (role === 'clinician') {
      await navigateTo('/episodes')
    } else {
      await navigateTo('/episodes/new')
    }

  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Error de conexión. Por favor intenta nuevamente.'
  } finally {
    isLoading.value = false
  }
}

// Auto-fill in development
onMounted(() => {
  if (isDevelopment.value) {
    // Pre-fill with admin credentials for faster development
    formData.email = 'admin@teaforms.local'
    formData.password = 'dev123'
  }
})
</script>

<style scoped>
/* Additional styles if needed */
</style>