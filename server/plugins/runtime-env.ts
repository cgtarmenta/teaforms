import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export default defineNitroPlugin(() => {
  try {
    if ((process as any).__ENV_LOADED__) return
    // Prefer environment provided by platform; if SESSION_SECRET is missing, try load .env packaged with server
    if (!process.env.SESSION_SECRET && !process.env.NUXT_SESSION_SECRET) {
      // Nitro server output root (e.g., /var/task). Try .env there.
      const here = dirname(fileURLToPath(import.meta.url))
      const candidates = [
        join(here, '..', '.env'), // /var/task/.env
        join(here, '.env'),       // fallback if structure differs
      ]
      for (const p of candidates) {
        if (!existsSync(p)) continue
        const text = readFileSync(p, 'utf8')
        for (const line of text.split(/\r?\n/)) {
          if (!line || line.trim().startsWith('#')) continue
          const idx = line.indexOf('=')
          if (idx === -1) continue
          const key = line.slice(0, idx).trim()
          const val = line.slice(idx + 1).trim().replace(/^"|"$/g, '')
          if (!process.env[key]) process.env[key] = val
        }
        break
      }
    }
    ;(process as any).__ENV_LOADED__ = true
  } catch {
    // noop
  }
})

