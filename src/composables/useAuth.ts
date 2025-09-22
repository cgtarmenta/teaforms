import { ref } from 'vue'
import { useRouter } from 'vue-router'

export type User = { email: string; role: string }

export const user = ref<User | null>(null)

// Seed initial user on client to avoid hydration mismatch
if (typeof window !== 'undefined') {
  // @ts-ignore
  const seeded = (window as any).__USER__
  if (seeded !== undefined) user.value = seeded
}

export async function refresh() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
    const data = await res.json()
    user.value = data.user
  } catch {}
  return user.value
}

export function useAuth() {
  const router = useRouter()

  async function login(payload: { email: string; password?: string; role?: string }, redirectTo?: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    user.value = data.user
    if (redirectTo) router.push(redirectTo)
    return user.value
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    user.value = null
    router.push('/login')
  }

  return { user, refresh, login, logout }
}
