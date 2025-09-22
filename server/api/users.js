import { Router } from 'express'
import { ensureRepos } from '../repositories/index.js'

export const usersRouter = Router()

usersRouter.get('/', async (req, res) => {
  const { users } = await ensureRepos()
  res.json(await users.list())
})

// Admin only
usersRouter.post('/', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (role !== 'sysadmin') return res.status(403).json({ error: 'forbidden' })
  const { users } = await ensureRepos()
  const { email, role: newRole = 'teacher', active = true } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email required' })
  const u = await users.create({ email, role: newRole, active })
  res.status(201).json(u)
})

usersRouter.put('/:id', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (role !== 'sysadmin') return res.status(403).json({ error: 'forbidden' })
  const { users } = await ensureRepos()
  const u = await users.update(req.params.id, req.body || {})
  if (!u) return res.status(404).json({ error: 'not found' })
  res.json(u)
})

usersRouter.delete('/:id', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (role !== 'sysadmin') return res.status(403).json({ error: 'forbidden' })
  const { users } = await ensureRepos()
  const u = await users.remove(req.params.id)
  if (!u) return res.status(404).json({ error: 'not found' })
  res.json(u)
})
