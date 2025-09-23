<script setup lang="ts">
import { ref } from 'vue'
import AppInput from '../components/base/AppInput.vue'
import AppSelect from '../components/base/AppSelect.vue'
import AppButton from '../components/base/AppButton.vue'

const email = ref('teacher@example.com')
const password = ref('')
const role = ref<'teacher'|'clinician'|'sysadmin'>('teacher')
const loading = ref(false)
const error = ref('')

import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
const route = useRoute()
const { login } = useAuth()

async function submit(e: Event) {
  e.preventDefault()
  loading.value = true
  error.value = ''
  try {
    await login({ email: email.value, password: password.value, role: role.value }, (route.query.redirect as string) || '/')
  } catch (e:any) {
    error.value = e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="max-w-md mx-auto my-8 p-6 bg-white rounded border shadow-sm">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('login.title') }}</h1>
    <form class="space-y-4" @submit="submit">
      <AppInput v-model="email" type="email" :label="$t('login.email') as string" required autocomplete="email" />
      <AppInput v-model="password" type="password" :label="$t('login.password') as string" autocomplete="current-password" />
      <AppSelect v-model="role" :label="$t('login.role') as string" :options="[
        { value: 'teacher', label: $t('roles.teacher') as string },
        { value: 'clinician', label: $t('roles.clinician') as string },
        { value: 'sysadmin', label: $t('roles.sysadmin') as string },
      ]" />
      <p v-if="error" class="text-red-600">{{ error }}</p>
      <AppButton :disabled="loading" type="submit">{{ loading ? $t('login.signingIn') : $t('login.signIn') }}</AppButton>
    </form>
  </main>
  
</template>

