<script setup lang="ts">
import AppButton from '../components/base/AppButton.vue'
</script>

<template>
  <section class="max-w-4xl mx-auto text-center p-6">
    <h1 class="text-3xl font-bold">{{ $t('landing.title') }}</h1>
    <p class="mt-3 text-slate-700">{{ $t('landing.subtitle') }}</p>
    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <AppButton to="/login" block>{{ $t('landing.ctaLogin') }}</AppButton>
    </div>
  </section>
  <section class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
    <div class="border rounded bg-white p-4">
      <h2 class="text-lg font-semibold">{{ $t('landing.cards.fast') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ $t('landing.cards.fastDesc') }}</p>
    </div>
    <div class="border rounded bg-white p-4">
      <h2 class="text-lg font-semibold">{{ $t('landing.cards.secure') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ $t('landing.cards.secureDesc') }}</p>
    </div>
    <div class="border rounded bg-white p-4">
      <h2 class="text-lg font-semibold">{{ $t('landing.cards.mobile') }}</h2>
      <p class="mt-2 text-sm text-slate-700">{{ $t('landing.cards.mobileDesc') }}</p>
    </div>
  </section>
</template>

