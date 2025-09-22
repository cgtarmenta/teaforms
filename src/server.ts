// src/server.ts
// Server entry: must export `render(url)` returning { html, head }.

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
// import { createHead } from '@unhead/vue' // optional

import App from './App.vue'
import routes from './routes'
import { createI18n } from './i18n'

type Ctx = { user?: { email?: string; role?: string } | null; locale?: string }

export async function render(url: string, ctx?: Ctx) {
  const app = createSSRApp(App)
  const router = createRouter({ history: createMemoryHistory(), routes })
  app.use(router)
  const i18n = createI18n(ctx?.locale || 'es')
  app.use(i18n)

  // const head = createHead()
  // app.use(head)

  // SSR route gating based on meta
  const to = router.resolve(url)
  const matched = to.matched || []
  const requiresAuth = matched.some((r) => (r.meta as any)?.requiresAuth)
  const roles = matched
    .flatMap((r) => (Array.isArray((r.meta as any)?.roles) ? ((r.meta as any)?.roles as string[]) : []))
  let target = to
  const userRole = ctx?.user?.role
  if (requiresAuth && !userRole) {
    target = router.resolve({ path: '/login', query: { redirect: url } })
  } else if (roles.length > 0 && userRole && !roles.includes(userRole)) {
    target = router.resolve('/403')
  }

  await router.push(target)
  await router.isReady()

  const html = await renderToString(app)
  const headHtml = '' // or head.renderHead().headTags if you use unhead

  return { html, head: headHtml }
}
