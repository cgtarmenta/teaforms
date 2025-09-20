import { FormService } from '@/server/models/Form'
import type { PageContextServer } from 'vite-plugin-ssr/types'

export async function onBeforeRender(pageContext: PageContextServer) {
  // Check authentication
  const token = pageContext.headers?.authorization || pageContext.cookies?.token
  
  if (!token) {
    return {
      pageContext: {
        redirectTo: '/login',
        pageProps: {}
      }
    }
  }

  try {
    // Get query parameters
    const url = new URL(pageContext.urlOriginal, `http://localhost`)
    const status = url.searchParams.get('status') || 'active'
    const category = url.searchParams.get('category')
    
    let forms = []
    
    // Fetch forms based on filters
    if (status === 'all') {
      // Get all forms
      const activeForms = await FormService.getAllActiveForms()
      const draftForms = await FormService.getFormsByStatus('draft')
      const archivedForms = await FormService.getFormsByStatus('archived')
      forms = [...activeForms, ...draftForms, ...archivedForms]
    } else {
      forms = await FormService.getFormsByStatus(status)
    }
    
    // Apply category filter if needed
    if (category) {
      forms = forms.filter(form => form.category === category)
    }
    
    // Sort by creation date (newest first)
    forms.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return {
      pageContext: {
        pageProps: {
          forms,
          initialFilters: {
            status,
            category
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading forms:', error)
    return {
      pageContext: {
        pageProps: {
          forms: [],
          error: 'Failed to load forms'
        }
      }
    }
  }
}

// Pre-render function for static generation (optional)
export const prerender = false // Disable pre-rendering for dynamic content