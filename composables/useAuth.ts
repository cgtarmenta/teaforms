export type User = { email: string; role: 'teacher'|'clinician'|'sysadmin' }

export function useAuth() {
  const user = useState<User | null>('user', () => null)

  async function refresh() {
    try { const res:any = await $fetch('/api/auth/me'); user.value = res?.user || null } catch { user.value = null }
    return user.value
  }
  async function login(payload: { email: string; password?: string; role?: User['role'] }, redirectTo?: string) {
    await $fetch('/api/auth/login', { method: 'POST', body: payload })
    await refresh()
    if (redirectTo) navigateTo(redirectTo)
  }
  async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); user.value = null; navigateTo('/login') }

  return { user, refresh, login, logout }
}

