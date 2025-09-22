import { Router } from 'express'
import { ensureRepos } from '../repositories/index.js'

export const formsRouter = Router()

formsRouter.get('/', async (_req, res) => {
  const { forms } = await ensureRepos()
  const list = await forms.list()
  res.json(list)
})

formsRouter.post('/', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const { title, status = 'active' } = req.body || {}
  if (!title) return res.status(400).json({ error: 'title required' })
  const form = await forms.create({ title, status })
  res.status(201).json(form)
})

formsRouter.get('/:id', async (req, res) => {
  const { forms } = await ensureRepos()
  const f = await forms.get(req.params.id)
  if (!f) return res.status(404).json({ error: 'not found' })
  res.json(f)
})

formsRouter.put('/:id', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const { title, status } = req.body || {}
  const f = await forms.update(req.params.id, { title, status })
  if (!f) return res.status(404).json({ error: 'not found' })
  res.json(f)
})

formsRouter.delete('/:id', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const removed = await forms.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'not found' })
  res.json(removed)
})

// Fields APIs
formsRouter.get('/:id/fields', async (req, res) => {
  const { forms } = await ensureRepos()
  const items = await forms.listFields(req.params.id)
  res.json(items)
})

formsRouter.post('/:id/fields', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const field = req.body || {}
  if (!field.label || !field.type) return res.status(400).json({ error: 'label and type are required' })
  const created = await forms.createField(req.params.id, field)
  res.status(201).json(created)
})

formsRouter.put('/:id/fields/:fieldId', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const patch = req.body || {}
  const updated = await forms.updateField(req.params.id, req.params.fieldId, patch)
  if (!updated) return res.status(404).json({ error: 'not found' })
  res.json(updated)
})

formsRouter.delete('/:id/fields/:fieldId', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { forms } = await ensureRepos()
  const removed = await forms.removeField(req.params.id, req.params.fieldId)
  if (!removed) return res.status(404).json({ error: 'not found' })
  res.json(removed)
})
