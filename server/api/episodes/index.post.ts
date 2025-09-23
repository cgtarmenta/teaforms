import { readBody } from 'h3'
import { getUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  if (!user || !['teacher','clinician','sysadmin'].includes(user.role)) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const body = await readBody(event)
  const formId = body?.formId
  const timestamp = body?.timestamp || new Date().toISOString()
  const context = body?.context || 'other'
  const data = body?.data || {}
  if (!formId) {
    setResponseStatus(event, 400)
    return { error: 'formId required' }
  }
  // Validate
  try {
    const { ensureRepos } = await import('#repos')
    const { forms, episodes } = await ensureRepos()
    const fields = await forms.listFields(formId)
    const errors: Record<string, any> = {}
    for (const f of fields) {
      const v = data[f.fieldId]
      if (f.required) {
        const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
        if (empty) { errors[f.fieldId] = { code: 'required' }; continue }
      }
      if (v == null) continue
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
          if (f.validation?.regex) { try { const re=new RegExp(f.validation.regex); if (!re.test(s)) errors[f.fieldId] = { code: 'regex' } } catch {} }
          break
        }
        case 'select':
        case 'radio': {
          if (Array.isArray(f.options) && f.options.length && !f.options.includes(v)) errors[f.fieldId] = { code: 'option' }
          break
        }
        case 'checkbox': {
          if (!(typeof v === 'boolean' || v === 'on' || v === 'true' || v === 'false')) errors[f.fieldId] = { code: 'boolean' }
          break
        }
      }
    }
    if (Object.keys(errors).length) {
      setResponseStatus(event, 400)
      return { error: 'validation', errors }
    }
    const createdBy = user.email
    const ep = await episodes.create({ formId, timestamp, context, data, createdBy })
    setResponseStatus(event, 201)
    return ep
  } catch (e:any) {
    setResponseStatus(event, 500)
    return { error: e?.message || 'server error' }
  }
})

