<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'
const { t } = useI18n()
const { user } = useAuth()
</script>

<template>
  <section class="max-w-4xl mx-auto text-center p-6">
    <h1 class="text-3xl font-bold">{{ t('landing.title') }}</h1>
    <p class="mt-3 text-slate-700">{{ t('landing.subtitle') }}</p>
    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <AppButton v-if="!user" to="/login" block>{{ t('landing.ctaLogin') }}</AppButton>
      <AppButton v-if="user && (user as any).role==='teacher'" to="/episodes/new" variant="secondary" block>{{ t('landing.ctaNewEpisode') }}</AppButton>
      <AppButton v-if="user && ((user as any).role==='clinician' || (user as any).role==='sysadmin')" to="/forms" variant="secondary" block>{{ t('landing.ctaManageForms') }}</AppButton>
      <AppButton v-if="user && (user as any).role==='sysadmin'" to="/admin/users" variant="secondary" block>{{ t('landing.ctaAdmin') }}</AppButton>
    </div>
  </section>

  <section class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
    <AppCard>
      <h2 class="text-lg font-semibold">{{ t('landing.cards.fast') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ t('landing.cards.fastDesc') }}</p>
    </AppCard>
    <AppCard>
      <h2 class="text-lg font-semibold">{{ t('landing.cards.secure') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ t('landing.cards.secureDesc') }}</p>
    </AppCard>
    <AppCard>
      <h2 class="text-lg font-semibold">{{ t('landing.cards.mobile') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ t('landing.cards.mobileDesc') }}</p>
    </AppCard>
  </section>

</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover { filter: drop-shadow(0 0 2em #646cffaa); }
.logo.vue:hover { filter: drop-shadow(0 0 2em #42b883aa); }
</style>
