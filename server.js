// server.mjs
// Minimal SSR host for a Vue + Vite app.
// In development, Vite middleware transpiles TS/.vue and loads /src/server.ts via ssrLoadModule.
// In production, it serves dist/client and imports the SSR bundle from dist/server.
//
// Requirements:
//  - ESM enabled (use .mjs or "type":"module" in package.json)
//  - Build scripts: `vite build` (client) and `vite build --ssr src/server.ts --outDir dist/server`
//  - index.html must include <!--app-head--> and <!--app-html-->

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'
import { createServer as createNodeServer } from 'node:http'
import { usersRouter } from './server/api/users.js'
import { formsRouter } from './server/api/forms.js'
import { episodesRouter } from './server/api/episodes.js'
import { attachAuth } from './server/auth.js'
import { authRouter } from './server/api/auth.js'
import { getUserByToken } from './server/auth/session.js'
import { exportRouter } from './server/api/export.js'

const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (p) => path.resolve(__dirname, p)

let templateHtml = ''
if (isProduction) {
  // Read the client HTML produced by `vite build`
  templateHtml = await fs.readFile(resolve('dist/client/index.html'), 'utf-8')
}

const app = express()
const httpServer = createNodeServer(app)
app.use(express.json())

/** @type {import('vite').ViteDevServer | undefined} */
let vite

if (!isProduction) {
  // Dev: run Vite in middleware mode and load TS/.vue via vite.ssrLoadModule
  const { createServer } = await import('vite')

  vite = await createServer({
    // Explicit path so Vite loads your plugins from vite.config.ts (vue, ts paths, etc.)
    configFile: path.resolve(__dirname, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'custom',
    base,
  })

  app.use(vite.middlewares)
} else {
  // Prod: serve prebuilt client assets
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  // IMPORTANT: serve the folder dist/client, not a single file
  app.use(base, sirv(resolve('dist/client'), { extensions: [] }))
}

// Lightweight API routes (non-blocking healthcheck)
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, env: isProduction ? 'production' : 'development' })
})

// Report selected data backend
app.get('/api/backend', async (req, res) => {
  const { ensureRepos } = await import('./server/repositories/index.js')
  const repos = await ensureRepos()
  res.json({ backend: repos.backend })
})

// Mount API routers
app.use('/api', attachAuth)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/forms', formsRouter)
app.use('/api/episodes', episodesRouter)
app.use('/api/export', exportRouter)

// Universal route: render SSR
app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl

    let template
    let render

    if (!isProduction) {
      // Fresh template so Vite HTML transforms & HMR apply
      template = await fs.readFile(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)

      // Vite compiles TS/.vue on the fly; ensure your SSR entry exports `render(url)`
      // Example SSR entry: /src/server.ts
      //   export async function render(url: string) { return { html, head } }
      render = (await vite.ssrLoadModule('/src/server.ts')).render
    } else {
      template = templateHtml
      // Import the prebuilt SSR bundle. Try ESM (.mjs) then CJS (.js)
      let mod
      try {
      const entryMjs = pathToFileURL(resolve('dist/server/server.mjs')).href
      mod = await import(entryMjs)
    } catch (e) {
      const entryJs = pathToFileURL(resolve('dist/server/server.js')).href
      mod = await import(entryJs)
    }
    render = mod.render || mod.default?.render
  }

    // Extract user session for SSR routing/initial state
    const rawCookie = req.headers.cookie || ''
    const sid = rawCookie.split('sid=')[1]?.split(';')[0]
    const localeCookie = rawCookie.split('locale=')[1]?.split(';')[0]
    const user = getUserByToken(sid)
    const accept = String(req.headers['accept-language'] || '')
    const pickFromAccept = accept.toLowerCase().startsWith('en') ? 'en' : 'es'
    const locale = localeCookie || pickFromAccept || 'es'

    const ctx = await render(url, { user, locale }) // { html, head }

    const html = template
      .replace('<!--app-head-->', `${ctx?.head ?? ''}<script>window.__USER__=${JSON.stringify(user || null)};window.__LOCALE__=${JSON.stringify(locale)}</script>`)
      .replace('<!--app-html-->', ctx?.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    if (vite) vite.ssrFixStacktrace(e)
    console.error(e)
    res.status(500).end(e.stack ?? String(e))
  }
})

httpServer.listen(port, () => {
  console.log(`Server started at http://localhost:${port}${base}`)
})
