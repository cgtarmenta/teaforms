<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-600">
            Resumen de actividad y métricas del sistema
          </p>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="px-4 sm:px-6 lg:px-8 py-8">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard 
          v-for="stat in stats" 
          :key="stat.name"
          class="hover:shadow-lg transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div :class="[stat.bgColor, 'rounded-md p-3']">
                <component 
                  :is="stat.icon" 
                  class="h-6 w-6 text-white" 
                  aria-hidden="true" 
                />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {{ stat.name }}
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stat.value }}
                  </div>
                  <div 
                    v-if="stat.change"
                    :class="[
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                      'ml-2 flex items-baseline text-sm font-semibold'
                    ]"
                  >
                    {{ stat.change }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Charts Row -->
      <div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- Recent Episodes Chart -->
        <AppCard title="Episodios Recientes">
          <div class="h-64">
            <canvas ref="episodesChart"></canvas>
          </div>
        </AppCard>

        <!-- Episodes by Intensity -->
        <AppCard title="Episodios por Intensidad">
          <div class="h-64">
            <canvas ref="intensityChart"></canvas>
          </div>
        </AppCard>
      </div>

      <!-- Recent Activity Table -->
      <div class="mt-8">
        <AppCard title="Actividad Reciente">
          <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="relative px-6 py-3">
                    <span class="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="activity in recentActivity" :key="activity.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(activity.timestamp) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ activity.userName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ activity.action }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="[
                        activity.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      ]"
                    >
                      {{ activity.status === 'completed' ? 'Completado' : 'Pendiente' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" class="text-primary-600 hover:text-primary-900">Ver</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppButton
            v-for="action in quickActions"
            :key="action.label"
            :variant="action.variant"
            :label="action.label"
            @click="handleQuickAction(action.action)"
            class="justify-center"
          >
            <template #icon>
              <component :is="action.icon" class="h-5 w-5 mr-2" />
            </template>
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AppCard from '@/components/AppCard.vue'
import AppButton from '@/components/AppButton.vue'

// Icons (using heroicons notation - will be replaced with actual icons)
const DocumentPlusIcon = 'DocumentPlusIcon'
const UsersIcon = 'UsersIcon'
const ChartBarIcon = 'ChartBarIcon'
const ClockIcon = 'ClockIcon'

const router = useRouter()

// Reactive data
const episodesChart = ref<HTMLCanvasElement>()
const intensityChart = ref<HTMLCanvasElement>()

// Stats data
const stats = ref([
  {
    name: 'Total Episodios',
    value: '142',
    change: '+12%',
    changeType: 'increase',
    icon: ChartBarIcon,
    bgColor: 'bg-primary-600'
  },
  {
    name: 'Episodios Hoy',
    value: '8',
    change: '+2',
    changeType: 'increase',
    icon: ClockIcon,
    bgColor: 'bg-green-600'
  },
  {
    name: 'Usuarios Activos',
    value: '24',
    change: '0',
    changeType: 'neutral',
    icon: UsersIcon,
    bgColor: 'bg-blue-600'
  },
  {
    name: 'Formularios',
    value: '6',
    change: '+1',
    changeType: 'increase',
    icon: DocumentPlusIcon,
    bgColor: 'bg-purple-600'
  }
])

// Recent activity data
const recentActivity = ref([
  {
    id: '1',
    timestamp: new Date().toISOString(),
    userName: 'María García',
    action: 'Registro de episodio',
    status: 'completed'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userName: 'Juan Pérez',
    action: 'Actualización de formulario',
    status: 'completed'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    userName: 'Ana Martínez',
    action: 'Registro de episodio',
    status: 'pending'
  }
])

// Quick actions
const quickActions = [
  {
    label: 'Nuevo Episodio',
    action: 'new-episode',
    variant: 'primary' as const,
    icon: DocumentPlusIcon
  },
  {
    label: 'Ver Episodios',
    action: 'view-episodes',
    variant: 'secondary' as const,
    icon: ChartBarIcon
  },
  {
    label: 'Gestionar Formularios',
    action: 'manage-forms',
    variant: 'outline' as const,
    icon: DocumentPlusIcon
  },
  {
    label: 'Usuarios',
    action: 'users',
    variant: 'outline' as const,
    icon: UsersIcon
  }
]

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
}

const handleQuickAction = (action: string) => {
  switch (action) {
    case 'new-episode':
      router.push('/episodes/new')
      break
    case 'view-episodes':
      router.push('/episodes')
      break
    case 'manage-forms':
      router.push('/forms')
      break
    case 'users':
      router.push('/users')
      break
  }
}

const initCharts = () => {
  // Initialize charts with Chart.js or similar
  // This is a placeholder - would need actual chart library integration
  console.log('Initializing charts...')
}

// Lifecycle
onMounted(() => {
  initCharts()
})
</script>