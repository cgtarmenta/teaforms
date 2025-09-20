<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-6 md:flex md:items-center md:justify-between">
          <div class="min-w-0 flex-1">
            <h1 class="text-3xl font-bold text-gray-900">Formularios</h1>
            <p class="mt-2 text-sm text-gray-600">
              Gestiona los formularios para el registro de episodios
            </p>
          </div>
          <div class="mt-4 flex md:mt-0 md:ml-4">
            <AppButton
              variant="outline"
              label="Importar"
              @click="handleImport"
              class="mr-3"
            />
            <AppButton
              variant="primary"
              label="Nuevo Formulario"
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

    <!-- Filters -->
    <div class="px-4 sm:px-6 lg:px-8 py-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppInput
            v-model="filters.search"
            type="text"
            placeholder="Buscar formularios..."
            @input="handleSearch"
          />
          <select
            v-model="filters.status"
            @change="handleFilterChange"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="archived">Archivado</option>
          </select>
          <select
            v-model="filters.category"
            @change="handleFilterChange"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Todas las categorías</option>
            <option value="behavioral">Conductual</option>
            <option value="academic">Académico</option>
            <option value="medical">Médico</option>
            <option value="other">Otro</option>
          </select>
          <AppButton
            variant="outline"
            label="Limpiar filtros"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <!-- Forms Grid -->
    <div class="px-4 sm:px-6 lg:px-8 pb-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando formularios...
        </div>
      </div>

      <div v-else-if="filteredForms.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay formularios</h3>
        <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo formulario.</p>
        <div class="mt-6">
          <AppButton
            variant="primary"
            label="Crear Formulario"
            @click="handleCreateNew"
          />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="form in filteredForms"
          :key="form.formId"
          class="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          @click="handleFormClick(form)"
        >
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-medium text-gray-900 truncate">
                  {{ form.title }}
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  {{ form.description || 'Sin descripción' }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0">
                <span
                  :class="[
                    form.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : form.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800',
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                  ]"
                >
                  {{ getStatusLabel(form.status) }}
                </span>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex items-center text-sm text-gray-500">
                <svg class="mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-1a1 1 0 100-2h1a4 4 0 014 4v6a4 4 0 01-4 4H6a4 4 0 01-4-4V7a4 4 0 014-4z" clip-rule="evenodd" />
                </svg>
                {{ form.fields?.length || 0 }} campos
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <svg class="mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                {{ formatDate(form.createdAt) }}
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <svg class="mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                </svg>
                v{{ form.version || 1 }}
              </div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <div class="flex space-x-2">
                <button
                  @click.stop="handleEdit(form)"
                  class="text-primary-600 hover:text-primary-900"
                  title="Editar"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="handleDuplicate(form)"
                  class="text-gray-600 hover:text-gray-900"
                  title="Duplicar"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
                <button
                  @click.stop="handleArchive(form)"
                  class="text-red-600 hover:text-red-900"
                  title="Archivar"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
              </div>
              <button
                @click.stop="handlePreview(form)"
                class="text-sm text-primary-600 hover:text-primary-900 font-medium"
              >
                Vista previa →
              </button>
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
import AppButton from '@/components/AppButton.vue'
import AppInput from '@/components/AppInput.vue'
import AppCard from '@/components/AppCard.vue'

const router = useRouter()

// Icons placeholder
const PlusIcon = 'PlusIcon'

// Types
interface Form {
  formId: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'archived'
  fields: any[]
  version: number
  category?: string
  createdAt: string
  createdBy: string
}

// State
const forms = ref<Form[]>([])
const loading = ref(true)
const filters = ref({
  search: '',
  status: '',
  category: ''
})

// Computed
const filteredForms = computed(() => {
  let result = [...forms.value]
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(form => 
      form.title.toLowerCase().includes(search) ||
      form.description?.toLowerCase().includes(search)
    )
  }
  
  if (filters.value.status) {
    result = result.filter(form => form.status === filters.value.status)
  }
  
  if (filters.value.category) {
    result = result.filter(form => form.category === filters.value.category)
  }
  
  return result
})

// Methods
const fetchForms = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/forms', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      forms.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching forms:', error)
  } finally {
    loading.value = false
  }
}

const handleCreateNew = () => {
  router.push('/forms/new')
}

const handleFormClick = (form: Form) => {
  router.push(`/forms/${form.formId}`)
}

const handleEdit = (form: Form) => {
  router.push(`/forms/${form.formId}/edit`)
}

const handleDuplicate = async (form: Form) => {
  if (confirm(`¿Duplicar el formulario "${form.title}"?`)) {
    try {
      const response = await fetch(`/api/forms/${form.formId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchForms()
      }
    } catch (error) {
      console.error('Error duplicating form:', error)
    }
  }
}

const handleArchive = async (form: Form) => {
  if (confirm(`¿Archivar el formulario "${form.title}"?`)) {
    try {
      const response = await fetch(`/api/forms/${form.formId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        await fetchForms()
      }
    } catch (error) {
      console.error('Error archiving form:', error)
    }
  }
}

const handlePreview = (form: Form) => {
  router.push(`/forms/${form.formId}/preview`)
}

const handleImport = () => {
  // TODO: Implement import functionality
  alert('Función de importación en desarrollo')
}

const handleSearch = () => {
  // Debounced search would go here
}

const handleFilterChange = () => {
  // Filter change logic
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    category: ''
  }
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    archived: 'Archivado'
  }
  return labels[status] || status
}

// Lifecycle
onMounted(() => {
  fetchForms()
})
</script>