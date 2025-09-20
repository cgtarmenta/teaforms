import type { Express } from 'express'
import { authenticate, authorize } from '../../auth.js'
import { setupFormRoutes } from './forms.js'
import { setupEpisodeRoutes } from './episodes.js'
import { setupUserRoutes } from './users.js'

export async function setupApiRoutes(app: Express) {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      authenticated: !!req.user 
    })
  })

  // Setup route modules
  setupFormRoutes(app)
  setupEpisodeRoutes(app)
  setupUserRoutes(app)

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' })
  })
}