<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from './composables/useAuth'
import AppButton from './components/base/AppButton.vue'
const { user, refresh, logout } = useAuth()
const { locale } = useI18n()
onMounted(() => { refresh() })
const isClinOrSys = () => !!user && (user as any).value && ['clinician','sysadmin'].includes((user as any).value.role)
const canEpisodes = () => !!user && (user as any).value && ['teacher','clinician','sysadmin'].includes((user as any).value.role)
function setLocale(l: 'es'|'en') {
  locale.value = l
  document.cookie = `locale=${l}; Path=/; SameSite=Lax`
}
const navOpen = ref(false)
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-1 rounded shadow">Skip to content</a>

  <header class="sticky top-0 z-10 bg-white border-b shadow-sm sa-pt sa-pb">
    <div class="max-w-6xl mx-auto sa-px flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="md:hidden p-2 border border-slate-300 rounded text-slate-800 hover:bg-emerald-50" aria-label="Open Menu" @click="navOpen = !navOpen">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M3.75 7.5h16.5v1.5H3.75zM3.75 12h16.5v1.5H3.75zM3.75 16.5h16.5V18H3.75z"/></svg>
        </button>
        <router-link to="/" class="font-semibold text-slate-900">TeaForms</router-link>
      </div>
      <nav class="hidden md:flex items-center gap-1">
        <router-link class="px-3 py-2 rounded hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700" to="/">{{$t('nav.home')}}</router-link>
        <router-link v-if="isClinOrSys()" class="px-3 py-2 rounded hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700" to="/forms">{{$t('nav.forms')}}</router-link>
        <router-link v-if="canEpisodes()" class="px-3 py-2 rounded hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700" to="/episodes">{{$t('nav.episodes')}}</router-link>
        <router-link v-if="user && user.role==='sysadmin'" class="px-3 py-2 rounded hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700" to="/admin/users">{{$t('nav.admin')}}</router-link>
        <router-link v-if="user && user.role==='sysadmin'" class="px-3 py-2 rounded hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700" to="/admin/analytics">{{$t('nav.analytics')}}</router-link>
      </nav>
      <div class="hidden md:flex items-center gap-3">
        <div class="opacity-70 flex items-center gap-2">
          <span>{{$t('nav.lang')}}:</span>
          <button class="px-2 py-1 rounded hover:bg-emerald-50" @click="setLocale('es')">ES</button>
          <button class="px-2 py-1 rounded hover:bg-emerald-50" @click="setLocale('en')">EN</button>
        </div>
        <div class="opacity-70">
          <template v-if="user">
            {{ user.email }} • {{ user.role }}
            <AppButton size="sm" variant="ghost" @click="logout">{{$t('nav.logout')}}</AppButton>
          </template>
          <template v-else>
            <AppButton size="sm" variant="ghost" to="/login">{{$t('nav.login')}}</AppButton>
          </template>
        </div>
      </div>
    </div>
    <div v-if="navOpen" class="md:hidden border-t mt-2 sa-px">
      <nav class="flex flex-col py-2 gap-2">
        <router-link class="px-3 py-2 rounded hover:bg-emerald-50" to="/" @click="navOpen=false">{{$t('nav.home')}}</router-link>
        <router-link v-if="isClinOrSys()" class="px-3 py-2 rounded hover:bg-emerald-50" to="/forms" @click="navOpen=false">{{$t('nav.forms')}}</router-link>
        <router-link v-if="canEpisodes()" class="px-3 py-2 rounded hover:bg-emerald-50" to="/episodes" @click="navOpen=false">{{$t('nav.episodes')}}</router-link>
        <router-link v-if="user && user.role==='sysadmin'" class="px-3 py-2 rounded hover:bg-emerald-50" to="/admin/users" @click="navOpen=false">{{$t('nav.admin')}}</router-link>
        <router-link v-if="user && user.role==='sysadmin'" class="px-3 py-2 rounded hover:bg-emerald-50" to="/admin/analytics" @click="navOpen=false">{{$t('nav.analytics')}}</router-link>
        <div class="pt-2 flex items-center gap-2">
          <span class="opacity-70">{{$t('nav.lang')}}:</span>
          <AppButton size="sm" variant="ghost" @click="setLocale('es')">ES</AppButton>
          <AppButton size="sm" variant="ghost" @click="setLocale('en')">EN</AppButton>
        </div>
        <div class="pt-1">
          <template v-if="user">
            <div class="opacity-70 mb-2">{{ user.email }} • {{ user.role }}</div>
            <AppButton size="sm" variant="ghost" @click="logout">{{$t('nav.logout')}}</AppButton>
          </template>
          <template v-else>
            <AppButton size="sm" variant="ghost" to="/login">{{$t('nav.login')}}</AppButton>
          </template>
        </div>
      </nav>
    </div>
  </header>

  <main id="main" class="max-w-6xl mx-auto sa-px py-6">
    <router-view />
  </main>

  <footer class="py-8 text-center opacity-60 text-sm">
    TeaForms • Vue 3 + SSR
  </footer>
</template>

<style scoped>
/* minimal styles */
</style>
