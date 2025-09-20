import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: 'sysadmin' | 'admin' | 'teacher' | 'viewer'
  phone?: string
  locale?: string
  timezone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user: Ref<User | null> = ref(null)
  const token: Ref<string | null> = ref(null)
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  // Getters
  const isAuthenticated: ComputedRef<boolean> = computed(() => !!user.value && !!token.value)
  
  const userRole: ComputedRef<string | null> = computed(() => user.value?.role || null)
  
  const userName: ComputedRef<string> = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`.trim()
  })
  
  const isAdmin: ComputedRef<boolean> = computed(() => {
    return user.value?.role === 'admin' || user.value?.role === 'sysadmin'
  })
  
  const isSysAdmin: ComputedRef<boolean> = computed(() => {
    return user.value?.role === 'sysadmin'
  })
  
  const canManageForms: ComputedRef<boolean> = computed(() => {
    return isAdmin.value
  })
  
  const canViewReports: ComputedRef<boolean> = computed(() => {
    return !!user.value // All authenticated users can view reports
  })

  // Actions
  const setUser = (userData: User | null) => {
    user.value = userData
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const setToken = (authToken: string | null) => {
    token.value = authToken
    if (authToken) {
      localStorage.setItem('token', authToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Login failed')
      }

      const data = await response.json()
      
      setUser(data.user)
      setToken(data.token)
      
      return true
    } catch (err: any) {
      error.value = err.message || 'An error occurred during login'
      console.error('Login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setToken(null)
      loading.value = false
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!storedToken || !storedUser) {
      return false
    }

    try {
      // Verify token with backend
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const data = await response.json()
      
      setToken(storedToken)
      setUser(data.user)
      
      return true
    } catch (err) {
      console.error('Auth check failed:', err)
      setUser(null)
      setToken(null)
      return false
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user.value) return false
    
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/users/${user.value.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      return false
    } finally {
      loading.value = false
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false

    const permissions: Record<string, string[]> = {
      'sysadmin': ['all'],
      'admin': ['manage_forms', 'manage_users', 'view_reports', 'create_episodes', 'edit_episodes'],
      'teacher': ['create_episodes', 'edit_own_episodes', 'view_reports'],
      'viewer': ['view_reports']
    }

    const userPermissions = permissions[user.value.role] || []
    return userPermissions.includes('all') || userPermissions.includes(permission)
  }

  // Initialize auth state on store creation
  if (typeof window !== 'undefined') {
    checkAuth()
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    isAdmin,
    isSysAdmin,
    canManageForms,
    canViewReports,
    
    // Actions
    setUser,
    setToken,
    login,
    logout,
    checkAuth,
    updateProfile,
    hasPermission,
  }
})