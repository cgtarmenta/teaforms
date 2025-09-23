<script setup lang="ts">
import { useCookie } from '#app'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth'
const route = useRoute()
const { locale } = useI18n()
const { user, logout } = useAuth()
function setLocale(l: 'es'|'en') {
  locale.value = l
  const c = useCookie('locale', { sameSite: 'lax', path: '/' })
  c.value = l
}
function ariaFor(path: string) {
  return route.path === path ? 'page' : undefined
}
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-1 rounded shadow">Skip to content</a>
  <header class="sticky top-0 z-10 bg-white border-b shadow-sm py-2">
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between">
      <NuxtLink to="/" class="font-semibold text-slate-900">TeaForms</NuxtLink>
      <nav class="flex items-center gap-2">
        <NuxtLink class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/" :aria-current="ariaFor('/')">{{ $t('nav.home') }}</NuxtLink>
        <template v-if="user">
          <NuxtLink class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/episodes" :aria-current="ariaFor('/episodes')">{{ $t('nav.episodes') }}</NuxtLink>
          <NuxtLink v-if="user.role==='clinician' || user.role==='sysadmin'" class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/forms" :aria-current="ariaFor('/forms')">{{ $t('nav.forms') }}</NuxtLink>
          <NuxtLink v-if="user.role==='sysadmin'" class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/admin/users" :aria-current="ariaFor('/admin/users')">{{ $t('nav.users') }}</NuxtLink>
          <NuxtLink v-if="user.role==='sysadmin'" class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/admin/analytics" :aria-current="ariaFor('/admin/analytics')">{{ $t('nav.analytics') }}</NuxtLink>
          <button class="nav-link px-3 py-2 rounded hover:bg-emerald-50" @click="logout">{{ $t('nav.logout') }}</button>
        </template>
        <NuxtLink v-else class="nav-link px-3 py-2 rounded hover:bg-emerald-50" to="/login" :aria-current="ariaFor('/login')">{{ $t('nav.login') }}</NuxtLink>
        <div class="px-2">
          <span class="sr-only">{{ $t('nav.lang') }}</span>
          <button class="px-2 py-1 rounded hover:bg-emerald-50" :aria-pressed="locale==='es'" @click="setLocale('es')">ES</button>
          <button class="px-2 py-1 rounded hover:bg-emerald-50" :aria-pressed="locale==='en'" @click="setLocale('en')">EN</button>
        </div>
      </nav>
    </div>
  </header>
  <main id="main" class="max-w-6xl mx-auto px-4 py-6">
    <NuxtPage />
  </main>
  <footer class="py-8 text-center opacity-60 text-sm">TeaForms • Nuxt 3 SSR</footer>
  
</template>

<style>
html,body,#app{height:100%}
body{background:#f8fafc;color:#0f172a}
/* Higher-contrast active nav */
.nav-link.router-link-exact-active{background:#065f46;color:#ffffff}
</style>

