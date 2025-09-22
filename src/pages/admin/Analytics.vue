<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '../../components/base/AppInput.vue'
import AppButton from '../../components/base/AppButton.vue'
import AppCard from '../../components/base/AppCard.vue'
const { t } = useI18n()

const formId = ref('')
const context = ref('')
const from = ref('')
const to = ref('')

function openExport(kind: 'pdf'|'xml') {
  const qs = new URLSearchParams({ formId: formId.value || '', context: context.value || '', from: from.value || '', to: to.value || '' })
  window.open(`/api/export/${kind}?` + qs.toString(), '_blank')
}
</script>

<template>
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Analytics / Export</h1>
    <AppCard class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <AppInput v-model="formId" label="FormId" />
        <AppInput v-model="context" :label="$t('episodes.context') as string" />
        <label class="block"><span class="text-sm">{{$t('export.from')}}</span><input type="date" v-model="from" class="w-full border rounded px-3 py-2" /></label>
        <label class="block"><span class="text-sm">{{$t('export.to')}}</span><input type="date" v-model="to" class="w-full border rounded px-3 py-2" /></label>
      </div>
      <div class="mt-3 flex gap-3">
        <AppButton variant="danger" @click="() => openExport('pdf')">{{$t('export.pdf')}}</AppButton>
        <AppButton variant="danger" @click="() => openExport('xml')">{{$t('export.xml')}}</AppButton>
      </div>
    </AppCard>
  </main>
</template>

<style scoped>
</style>
