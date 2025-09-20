import { EpisodeService } from '@/server/models/Episode'
import { FormService } from '@/server/models/Form'
import { UserService } from '@/server/models/User'
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
    const formId = url.searchParams.get('formId')
    const intensity = url.searchParams.get('intensity')
    const status = url.searchParams.get('status')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    let episodes = []
    
    // Fetch episodes based on filters
    if (formId) {
      episodes = await EpisodeService.getEpisodesByForm(formId, limit * 2) // Get extra for pagination
    } else if (startDate && endDate) {
      episodes = await EpisodeService.getEpisodesByDateRange(startDate, endDate, formId)
    } else {
      // Use search with criteria
      episodes = await EpisodeService.searchEpisodes({
        formId,
        status,
        intensity,
        startDate,
        endDate,
        limit: limit * 2
      })
    }
    
    // Get statistics
    const stats = await EpisodeService.getEpisodeStatistics(formId, startDate, endDate)
    
    // Get active forms for filter dropdown
    const activeForms = await FormService.getAllActiveForms()
    
    // Get users map for display names (optional - can be done client-side)
    const userIds = [...new Set(episodes.map(e => e.submittedBy))]
    const users = await Promise.all(
      userIds.slice(0, 20).map(id => UserService.findById(id))
    )
    const usersMap = users.reduce((acc, user) => {
      if (user) {
        acc[user.userId] = `${user.firstName} ${user.lastName}`
      }
      return acc
    }, {} as Record<string, string>)
    
    // Paginate episodes
    const startIndex = (page - 1) * limit
    const paginatedEpisodes = episodes.slice(startIndex, startIndex + limit)
    
    return {
      pageContext: {
        pageProps: {
          episodes: paginatedEpisodes,
          totalEpisodes: episodes.length,
          stats,
          activeForms,
          usersMap,
          pagination: {
            page,
            limit,
            total: episodes.length,
            totalPages: Math.ceil(episodes.length / limit)
          },
          filters: {
            formId,
            intensity,
            status,
            startDate,
            endDate
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading episodes:', error)
    return {
      pageContext: {
        pageProps: {
          episodes: [],
          stats: {
            total: 0,
            byIntensity: {},
            byStatus: {},
            avgDuration: 0
          },
          activeForms: [],
          error: 'Failed to load episodes'
        }
      }
    }
  }
}

export const prerender = false // Disable pre-rendering for dynamic content