import type { Express } from 'express'
import { authenticate, authorize } from '../../auth'
import { localLogin, localLogout } from '../../auth-local'
import { setupFormRoutes } from './forms'
import { setupEpisodeRoutes } from './episodes'
import { setupUserRoutes } from './users'

const IS_LOCAL = process.env.LOCAL_DEVELOPMENT === 'true'

export async function setupApiRoutes(app: Express) {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      authenticated: !!req.user 
    })
  })

  // Auth routes for local development
  if (IS_LOCAL) {
    app.post('/api/auth/login/local', localLogin)
    app.post('/api/auth/logout', localLogout)
    app.get('/api/auth/me', authenticate, (req, res) => {
      res.json({ user: req.user })
    })
  }

  // Setup route modules
  setupFormRoutes(app)
  setupEpisodeRoutes(app)
  setupUserRoutes(app)

  // 404 handler for API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' })
    } else {
      next()
    }
  })
}
