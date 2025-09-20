<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Skip to content link for accessibility -->
    <a href="#main-content" class="skip-link">
      Saltar al contenido principal
    </a>

    <!-- Header -->
    <header v-if="showHeader" class="bg-white shadow-sm border-b safe-top">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and title -->
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              {{ appTitle }}
            </h1>
          </div>

          <!-- Desktop navigation -->
          <nav class="hidden md:flex space-x-4" v-if="isAuthenticated">
            <router-link 
              v-for="item in navItems" 
              :key="item.path"
              :to="item.path"
              class="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-primary-50 text-primary-700': isActive(item.path) }"
            >
              {{ item.label }}
            </router-link>
          </nav>

          <!-- User menu -->
          <div class="flex items-center space-x-3" v-if="isAuthenticated">
            <span class="text-sm text-gray-600 hidden sm:block">
              {{ currentUser?.firstName }} {{ currentUser?.lastName }}
            </span>
            <button 
              @click="logout"
              class="text-gray-500 hover:text-gray-700 p-2"
              aria-label="Cerrar sesión"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </div>
    </main>

    <!-- Mobile bottom navigation -->
    <nav v-if="showMobileNav" class="mobile-nav md:hidden">
      <div class="flex justify-around py-2">
        <router-link
          v-for="item in mobileNavItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center px-3 py-2 text-xs font-medium"
          :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-600'"
        >
          <component :is="item.icon" class="h-6 w-6 mb-1" />
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Loading overlay -->
    <transition name="fade">
      <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p class="mt-3 text-gray-600">Cargando...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageContext } from './usePageContext'

// Page context from SSR
const pageContext = usePageContext()

// Props
const props = defineProps<{
  showHeader?: boolean
  showMobileNav?: boolean
}>()

// State
const isLoading = ref(false)
const appTitle = ref('Episode Registry')

// Computed
const showHeader = computed(() => props.showHeader !== false)
const showMobileNav = computed(() => 
  props.showMobileNav !== false && isAuthenticated.value
)

const isAuthenticated = computed(() => !!pageContext.user)
const currentUser = computed(() => pageContext.user)

const navItems = computed(() => {
  const role = currentUser.value?.role
  const items = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/episodes', label: 'Episodios' }
  ]
  
  if (role === 'clinician' || role === 'sysadmin') {
    items.push({ path: '/forms', label: 'Formularios' })
  }
  
  if (role === 'sysadmin') {
    items.push({ path: '/users', label: 'Usuarios' })
  }
  
  return items
})

const mobileNavItems = computed(() => {
  return navItems.value.map(item => ({
    ...item,
    icon: getIconForPath(item.path)
  }))
})

// Methods
const isActive = (path: string) => {
  return pageContext.urlPathname.startsWith(path)
}

const getIconForPath = (path: string) => {
  // Return icon component name based on path
  switch(path) {
    case '/dashboard': return 'HomeIcon'
    case '/episodes': return 'DocumentIcon'
    case '/forms': return 'FormIcon'
    case '/users': return 'UsersIcon'
    default: return 'DocumentIcon'
  }
}

const logout = async () => {
  isLoading.value = true
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>