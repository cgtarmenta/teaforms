import { Router } from 'express'
import { ensureRepos } from '../repositories/index.js'

export const episodesRouter = Router()

episodesRouter.get('/', async (req, res) => {
  const { episodes } = await ensureRepos()
  const list = await episodes.list()
  const { formId, from, to, context } = req.query || {}
  let filtered = list
  if (formId) filtered = filtered.filter((e) => e.formId === formId)
  if (context) filtered = filtered.filter((e) => e.context === context)
  if (from) {
    const f = new Date(String(from)).getTime()
    if (!Number.isNaN(f)) filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= f)
  }
  if (to) {
    const t = new Date(String(to)).getTime()
    if (!Number.isNaN(t)) filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= t)
  }
  const role = req.user?.role || 'anonymous'
  if (role === 'teacher') {
    const email = req.user?.email
    return res.json(filtered.filter((e) => !email || e.createdBy === email))
  }
  res.json(filtered)
})

episodesRouter.post('/', async (req, res) => {
  const role = req.user?.role || 'anonymous'
  if (!['teacher', 'clinician', 'sysadmin'].includes(role)) return res.status(403).json({ error: 'forbidden' })
  const { episodes, forms } = await ensureRepos()
  const { formId, timestamp = new Date().toISOString(), context = 'other', data = {} } = req.body || {}
  if (!formId) return res.status(400).json({ error: 'formId required' })
  // Validate dynamic data against form schema
  try {
    const fields = await forms.listFields(formId)
    const errors = {}
    for (const f of fields) {
      const v = data[f.fieldId]
      // required
      if (f.required) {
        const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
        if (empty) {
          errors[f.fieldId] = { code: 'required' }
          continue
        }
      }
      if (v === undefined || v === null) continue
      // type checks
      switch (f.type) {
        case 'number': {
          const num = typeof v === 'number' ? v : Number(v)
          if (Number.isNaN(num)) errors[f.fieldId] = { code: 'number' }
          if (f.validation?.min != null && num < f.validation.min) errors[f.fieldId] = { code: 'min', value: f.validation.min }
          if (f.validation?.max != null && num > f.validation.max) errors[f.fieldId] = { code: 'max', value: f.validation.max }
          break
        }
        case 'text':
        case 'textarea': {
          const s = String(v)
          const max = f.validation?.maxLength
          if (max != null && s.length > max) errors[f.fieldId] = { code: 'maxLength', value: max }
          if (f.validation?.regex) {
            try { const re = new RegExp(f.validation.regex); if (!re.test(s)) errors[f.fieldId] = { code: 'regex' } } catch {}
          }
          break
        }
        case 'select':
        case 'radio': {
          if (Array.isArray(f.options) && f.options.length && !f.options.includes(v)) {
            errors[f.fieldId] = { code: 'option' }
          }
          break
        }
        case 'checkbox': {
          if (!(typeof v === 'boolean' || v === 'on' || v === 'true' || v === 'false')) errors[f.fieldId] = { code: 'boolean' }
          break
        }
        default:
          break
      }
    }
    if (Object.keys(errors).length) return res.status(400).json({ error: 'validation', errors })
  } catch (e) {
    // If schema unavailable, proceed without strict validation
  }
  const createdBy = req.user?.email || 'anonymous'
  const episode = await episodes.create({ formId, timestamp, context, createdBy, data })
  res.status(201).json(episode)
})

episodesRouter.get('/:id', async (req, res) => {
  const { episodes } = await ensureRepos()
  const e = await episodes.get(req.params.id)
  if (!e) return res.status(404).json({ error: 'not found' })
  res.json(e)
})
