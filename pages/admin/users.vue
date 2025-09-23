<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppCard from '../../components/base/AppCard.vue'
import AppButton from '../../components/base/AppButton.vue'

type User = { id: string; email: string; role: 'teacher'|'clinician'|'sysadmin'; active: boolean }
const users = ref<User[]>([])
const loading = ref(false)
const newEmail = ref('')
const newRole = ref<User['role']>('teacher')

async function load() {
  const res = await fetch('/api/users')
  users.value = res.ok ? await res.json() : []
}

async function createUser() {
  if (!newEmail.value) return
  loading.value = true
  try {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: newEmail.value, role: newRole.value }) })
    if (res.ok) { newEmail.value=''; newRole.value='teacher'; await load() }
  } finally { loading.value=false }
}

async function updateUser(u: User, patch: Partial<User>) {
  const res = await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(patch) })
  if (res.ok) await load()
}

async function removeUser(u: User) {
  if (!confirm(String($t('admin.confirmDelete')))) return
  const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
  if (res.ok) await load()
}

onMounted(load)
definePageMeta({ requiresAuth: true, roles: ['sysadmin'] })
</script>


<template>
  <main class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ $t('admin.users') }}</h1>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('admin.email') }}</span>
          <input v-model="newEmail" type="email" class="w-full border rounded px-3 py-2" placeholder="email@example.com" />
        </label>
        <label class="block">
          <span class="block text-sm mb-1">{{ $t('admin.role') }}</span>
          <select v-model="newRole" class="w-full border rounded px-3 py-2">
            <option value="teacher">{{ $t('roles.teacher') }}</option>
            <option value="clinician">{{ $t('roles.clinician') }}</option>
            <option value="sysadmin">{{ $t('roles.sysadmin') }}</option>
          </select>
        </label>
        <div>
          <AppButton :disabled="loading || !newEmail" @click="createUser">{{ $t('admin.create') }}</AppButton>
        </div>
      </div>
    </AppCard>

    <ul class="divide-y border rounded bg-white">
      <li v-for="u in users" :key="u.id" class="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="font-medium">{{ u.email }}</div>
          <div class="text-sm opacity-70">ID: {{ u.id.slice(0,8) }}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-1 text-sm">
            <span>{{ $t('admin.role') }}</span>
            <select :value="u.role" @change="updateUser(u, { role: ($event.target as HTMLSelectElement).value as any })" class="border rounded px-2 py-1">
              <option value="teacher">{{ $t('roles.teacher') }}</option>
              <option value="clinician">{{ $t('roles.clinician') }}</option>
              <option value="sysadmin">{{ $t('roles.sysadmin') }}</option>
            </select>
          </label>
          <label class="flex items-center gap-1 text-sm">
            <input type="checkbox" :checked="u.active" @change="updateUser(u, { active: ($event.target as HTMLInputElement).checked })" />
            <span>{{ $t('admin.active') }}</span>
          </label>
          <AppButton variant="secondary" size="sm" @click="removeUser(u)">{{ $t('admin.delete') }}</AppButton>
        </div>
      </li>
    </ul>
  </main>
</template>

