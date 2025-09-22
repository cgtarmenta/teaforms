import { describe, it, expect } from 'vitest'

describe('app', () => {
  it('has basic routes defined', async () => {
    const routes = (await import('../../src/routes')).default
    const paths = routes.map((r: any) => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/login')
  })
})

