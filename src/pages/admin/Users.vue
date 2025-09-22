<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppInput from '../../components/base/AppInput.vue'
import AppSelect from '../../components/base/AppSelect.vue'
import AppButton from '../../components/base/AppButton.vue'
import AppCard from '../../components/base/AppCard.vue'

type User = { id: string; email: string; role: string; active?: boolean }
const users = ref<User[]>([])
const email = ref('')
const role = ref<'teacher'|'clinician'|'sysadmin'>('teacher')
const loading = ref(false)

async function load() {
  const res = await fetch('/api/users')
  users.value = await res.json()
}

async function createUser() {
  if (!email.value) return
  loading.value = true
  try {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value, role: role.value }) })
    if (res.ok) { email.value=''; role.value='teacher'; await load() }
  } finally { loading.value = false }
}

async function setRole(u: User, r: string) {
  await fetch('/api/users/' + u.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: r }) })
  await load()
}

async function toggleActive(u: User) {
  await fetch('/api/users/' + u.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !u.active }) })
  await load()
}

async function removeUser(u: User) {
  if (!confirm('Delete user?')) return
  await fetch('/api/users/' + u.id, { method: 'DELETE' })
  await load()
}

onMounted(load)
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Users</h1>
    <AppCard class="mb-4">
      <div class="flex flex-col md:flex-row gap-2">
        <AppInput v-model="email" placeholder="email" />
        <AppSelect v-model="role" :options="[
          { value: 'teacher', label: 'teacher' },
          { value: 'clinician', label: 'clinician' },
          { value: 'sysadmin', label: 'sysadmin' },
        ]" />
        <AppButton :disabled="loading || !email" @click="createUser">Add</AppButton>
      </div>
    </AppCard>
    <ul class="divide-y border rounded bg-white">
      <li v-for="u in users" :key="u.id" class="p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
        <div class="md:col-span-2">
          <div class="font-medium">{{ u.email }}</div>
          <div class="text-sm opacity-70">{{ u.active ? 'active' : 'inactive' }}</div>
        </div>
        <div>
          <select :value="u.role" @change="(e:any)=> setRole(u, e.target.value)" class="border rounded px-3 py-2">
            <option value="teacher">teacher</option>
            <option value="clinician">clinician</option>
            <option value="sysadmin">sysadmin</option>
          </select>
        </div>
        <div class="flex gap-2">
          <AppButton size="sm" variant="ghost" @click="toggleActive(u)">{{ u.active ? 'Disable' : 'Enable' }}</AppButton>
          <AppButton size="sm" variant="danger" @click="removeUser(u)">Delete</AppButton>
        </div>
      </li>
    </ul>
  </main>
</template>

<style scoped>
</style>
