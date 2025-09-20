<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-6 md:flex md:items-center md:justify-between">
          <div class="min-w-0 flex-1">
            <h1 class="text-3xl font-bold text-gray-900">Episodios</h1>
            <p class="mt-2 text-sm text-gray-600">
              Registro y seguimiento de episodios conductuales
            </p>
          </div>
          <div class="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <AppButton
              variant="outline"
              label="Exportar"
              @click="handleExport"
            />
            <AppButton
              variant="primary"
              label="Nuevo Episodio"
              @click="handleCreateNew"
            >
              <template #icon>
                <PlusIcon class="h-5 w-5 mr-2" />
              </template>
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Stats -->
    <div class="px-4 sm:px-6 lg:px-8 py-4">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="bg-blue-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Episodios
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900">
                    {{ stats.total }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="bg-green-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Hoy
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900">
                    {{ stats.today }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="bg-yellow-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Pendientes
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900">
                    {{ stats.pending }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="bg-red-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Alta Intensidad
                  </dt>
                  <dd class="text-lg font-semibold text-gray-900">
                    {{ stats.highIntensity }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AppInput
            v-model="filters.search"
            type="text"
            placeholder="Buscar episodios..."
            @input="handleSearch"
          />
          <select
            v-model="filters.formId"
            @change="handleFilterChange"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Todos los formularios</option>
            <option v-for="form in availableForms" :key="form.formId" :value="form.formId">
              {{ form.title }}
            </option>
          </select>
          <select
            v-model="filters.intensity"
            @change="handleFilterChange"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Toda intensidad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
          <AppInput
            v-model="filters.dateFrom"
            type="date"
            placeholder="Desde"
            @change="handleFilterChange"
          />
          <AppInput
            v-model="filters.dateTo"
            type="date"
            placeholder="Hasta"
            @change="handleFilterChange"
          />
        </div>
      </div>
    </div>

    <!-- Episodes Table -->
    <div class="px-4 sm:px-6 lg:px-8 pb-8">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div v-if="loading" class="text-center py-12">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando episodios...
          </div>
        </div>

        <div v-else-if="filteredEpisodes.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No hay episodios</h3>
          <p class="mt-1 text-sm text-gray-500">No se encontraron episodios con los filtros aplicados.</p>
          <div class="mt-6">
            <AppButton
              variant="primary"
              label="Registrar Episodio"
              @click="handleCreateNew"
            />
          </div>
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID / Fecha
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formulario
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intensidad
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registrado por
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="episode in paginatedEpisodes" 
              :key="episode.episodeId"
              class="hover:bg-gray-50 cursor-pointer"
              @click="handleEpisodeClick(episode)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ episode.episodeId.substring(0, 8) }}...
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatDate(episode.createdAt) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ getFormTitle(episode.formId) }}</div>
                <div class="text-sm text-gray-500">v{{ episode.formVersion }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    getIntensityColor(episode.intensity),
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                  ]"
                >
                  {{ getIntensityLabel(episode.intensity) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ episode.duration ? `${episode.duration} min` : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ getUserName(episode.submittedBy) }}</div>
                <div class="text-sm text-gray-500">{{ episode.submittedFor || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    getStatusColor(episode.status),
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                  ]"
                >
                  {{ getStatusLabel(episode.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click.stop="handleView(episode)"
                    class="text-primary-600 hover:text-primary-900"
                    title="Ver"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    v-if="canEdit(episode)"
                    @click.stop="handleEdit(episode)"
                    class="text-gray-600 hover:text-gray-900"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    v-if="canDelete(episode)"
                    @click.stop="handleDelete(episode)"
                    class="text-red-600 hover:text-red-900"
                    title="Eliminar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Mostrando
                  <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                  a
                  <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredEpisodes.length) }}</span>
                  de
                  <span class="font-medium">{{ filteredEpisodes.length }}</span>
                  resultados
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span class="sr-only">Anterior</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {{ currentPage }} / {{ totalPages }}
                  </span>
                  <button
                    @click="currentPage++"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span class="sr-only">Siguiente</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'

const router = useRouter()
const authStore = useAuthStore()

// Icons placeholder
const PlusIcon = 'PlusIcon'

// Types
interface Episode {
  episodeId: string
  formId: string
  formVersion: number
  responses: any[]
  submittedBy: string
  submittedFor?: string
  status: 'draft' | 'submitted' | 'reviewed' | 'archived'
  intensity?: 'low' | 'medium' | 'high' | 'critical'
  duration?: number
  location?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// State
const episodes = ref<Episode[]>([])
const availableForms = ref<any[]>([])
const loading = ref(true)
const currentPage = ref(1)
const itemsPerPage = 10

const filters = ref({
  search: '',
  formId: '',
  intensity: '',
  dateFrom: '',
  dateTo: ''
})

const stats = ref({
  total: 0,
  today: 0,
  pending: 0,
  highIntensity: 0
})

// Computed
const filteredEpisodes = computed(() => {
  let result = [...episodes.value]
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(episode => 
      episode.episodeId.toLowerCase().includes(search) ||
      episode.notes?.toLowerCase().includes(search) ||
      episode.location?.toLowerCase().includes(search)
    )
  }
  
  if (filters.value.formId) {
    result = result.filter(episode => episode.formId === filters.value.formId)
  }
  
  if (filters.value.intensity) {
    result = result.filter(episode => episode.intensity === filters.value.intensity)
  }
  
  if (filters.value.dateFrom) {
    result = result.filter(episode => 
      new Date(episode.createdAt) >= new Date(filters.value.dateFrom)
    )
  }
  
  if (filters.value.dateTo) {
    result = result.filter(episode => 
      new Date(episode.createdAt) <= new Date(filters.value.dateTo + 'T23:59:59')
    )
  }
  
  return result
})

const totalPages = computed(() => 
  Math.ceil(filteredEpisodes.value.length / itemsPerPage)
)

const paginatedEpisodes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEpisodes.value.slice(start, end)
})

// Methods
const fetchEpisodes = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/episodes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      episodes.value = await response.json()
      updateStats()
    }
  } catch (error) {
    console.error('Error fetching episodes:', error)
  } finally {
    loading.value = false
  }
}

const fetchForms = async () => {
  try {
    const response = await fetch('/api/forms?status=active', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      availableForms.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching forms:', error)
  }
}

const updateStats = () => {
  const today = new Date().toISOString().split('T')[0]
  
  stats.value = {
    total: episodes.value.length,
    today: episodes.value.filter(e => 
      e.createdAt.startsWith(today)
    ).length,
    pending: episodes.value.filter(e => 
      e.status === 'draft' || e.status === 'submitted'
    ).length,
    highIntensity: episodes.value.filter(e => 
      e.intensity === 'high' || e.intensity === 'critical'
    ).length
  }
}

const handleCreateNew = () => {
  router.push('/episodes/new')
}

const handleEpisodeClick = (episode: Episode) => {
  router.push(`/episodes/${episode.episodeId}`)
}

const handleView = (episode: Episode) => {
  router.push(`/episodes/${episode.episodeId}`)
}

const handleEdit = (episode: Episode) => {
  router.push(`/episodes/${episode.episodeId}/edit`)
}

const handleDelete = async (episode: Episode) => {
  if (confirm(`¿Eliminar el episodio ${episode.episodeId}?`)) {
    try {
      const response = await fetch(`/api/episodes/${episode.episodeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchEpisodes()
      }
    } catch (error) {
      console.error('Error deleting episode:', error)
    }
  }
}

const handleExport = () => {
  // TODO: Implement export functionality
  alert('Función de exportación en desarrollo')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const canEdit = (episode: Episode) => {
  return authStore.isAdmin || episode.submittedBy === authStore.user?.userId
}

const canDelete = (episode: Episode) => {
  return authStore.isAdmin
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
}

const getFormTitle = (formId: string) => {
  const form = availableForms.value.find(f => f.formId === formId)
  return form?.title || formId
}

const getUserName = (userId: string) => {
  // TODO: Implement user lookup
  return userId
}

const getIntensityLabel = (intensity?: string) => {
  const labels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
  }
  return intensity ? labels[intensity] || intensity : '-'
}

const getIntensityColor = (intensity?: string) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  return intensity ? colors[intensity] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    submitted: 'Enviado',
    reviewed: 'Revisado',
    archived: 'Archivado'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  fetchEpisodes()
  fetchForms()
})
</script>