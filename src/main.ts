import { createSSRApp } from 'vue'
import App from './App.vue'
import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import routes from './routes'
import { user as authUser, refresh as authRefresh } from './composables/useAuth'
import { createI18n } from './i18n'

/**
 * SSR requires a fresh app instance per request, therefore we export a function
 * that creates a fresh app instance. If using Vuex, we'd also be creating a
 * fresh store here.
 */
export function createApp() {
  const app = createSSRApp(App)
  const history = import.meta.env.SSR ? createMemoryHistory() : createWebHistory()
  const router = createRouter({ history, routes })
  app.use(router)

  const initialLocale = (typeof window !== 'undefined' && (window as any).__LOCALE__) || 'es'
  const i18n = createI18n(initialLocale)
  app.use(i18n)

  // Auth route guards (client-only fetch for session)
  router.beforeEach(async (to) => {
    const requiresAuth = (to.meta as any)?.requiresAuth
    const roles = (to.meta as any)?.roles as string[] | undefined
    let u = authUser.value
    if (!import.meta.env.SSR && !u) {
      try { u = await authRefresh() } catch {}
    }
    if (requiresAuth && !u) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (roles && u && !roles.includes(u.role)) {
      return { path: '/403' }
    }
    return true
  })
  return { app, router }
}
