import express from 'express'
import compression from 'compression'
import { renderPage } from 'vite-plugin-ssr/server'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 3000

async function createServer() {
  const app = express()

  // Middlewares
  app.use(compression())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    
    // CSP header
    if (isProduction) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cognito-idp.*.amazonaws.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com wss://*.amazonaws.com"
      )
    }
    next()
  })

  // API Routes
  const { setupApiRoutes } = await import('./routes/api/index')
  await setupApiRoutes(app)

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  })

  // Vite SSR
  if (!isProduction) {
    const vite = await import('vite')
    const viteDevServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })
    app.use(viteDevServer.middlewares)
  } else {
    // Serve static assets in production
    const sirv = (await import('sirv')).default
    app.use(sirv(`${__dirname}/../../dist/client`))
  }

  // SSR handler - should be last
  app.use(async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
      user: (req as any).user || null, // Will be populated by auth middleware
      cookies: req.cookies
    }
    
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    
    if (!httpResponse) {
      return next()
    }
    
    const { statusCode, headers, earlyHints } = httpResponse
    
    // Send early hints if available
    if (earlyHints.length > 0 && res.socket) {
      res.writeEarlyHints({ link: earlyHints })
    }
    
    // Set headers
    headers.forEach(([name, value]) => res.setHeader(name, value))
    res.status(statusCode)
    
    // Send body
    httpResponse.pipe(res)
  })

  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`)
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔐 AWS Region: ${process.env.AWS_REGION || 'not-configured'}`)
  })
}

createServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})