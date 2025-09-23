<template>
  <main class="max-w-xl mx-auto my-12 p-6 text-center">
    <h1 class="text-2xl font-semibold mb-2">403 — Forbidden</h1>
    <p class="opacity-80 mb-4">{{ $t('common.forbidden') }}</p>
    <NuxtLink class="underline" to="/login">{{ $t('nav.login') }}</NuxtLink>
  </main>
</template>

