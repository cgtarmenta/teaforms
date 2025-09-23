export default defineNuxtRouteMiddleware(async (to) => {
  const meta: any = to.meta || {}
  if (!meta.requiresAuth) return
  const user = useState<any>('user')
  if (!user.value) {
    try {
      const res = await $fetch('/api/auth/me')
      user.value = (res as any)?.user || null
    } catch { user.value = null }
  }
  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (meta.roles && Array.isArray(meta.roles)) {
    const ok = (meta.roles as string[]).includes(user.value.role)
    if (!ok) return navigateTo('/403')
  }
})

