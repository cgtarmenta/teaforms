import { formsMemoryRepo } from './memory/forms.js'
import { episodesMemoryRepo } from './memory/episodes.js'
import { usersMemoryRepo } from './memory/users.js'

async function loadDdbRepos() {
  try {
    const mod = await import('./ddb/index.js')
    return mod.default
  } catch (e) {
    console.warn('[repos] DynamoDB repos not available, falling back to memory. Reason:', e?.message || e)
    return null
  }
}

let cached

export function getRepos() {
  if (cached) return cached
  const sel = String(process.env.DATA_BACKEND || '').toLowerCase()
  const flag = String(process.env.USE_DYNAMODB || '').toLowerCase()
  const useDdb = sel === 'ddb' || sel === 'dynamodb' || flag === '1' || flag === 'true' || flag === 'yes'
  cached = {
    backend: 'memory',
    forms: formsMemoryRepo,
    episodes: episodesMemoryRepo,
    users: usersMemoryRepo,
  }
  if (useDdb) {
    // Start async load but don't block module init; callers can await ensure()
    cached = {
      ...cached,
      backend: 'ddb',
      ensure: async () => {
        const ddbRepos = await loadDdbRepos()
        if (ddbRepos) cached = { ...ddbRepos, ensure: async () => {} }
        return cached
      },
    }
  } else {
    cached.ensure = async () => cached
  }
  return cached
}

export async function ensureRepos() {
  const repos = getRepos()
  if (repos.ensure) return repos.ensure()
  return repos
}
