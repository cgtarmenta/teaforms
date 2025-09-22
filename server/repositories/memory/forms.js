import { db } from '../../db/memory.js'
import { randomUUID } from 'node:crypto'

export const formsMemoryRepo = {
  async list() {
    return db.forms
  },
  async create({ title, status = 'active' }) {
    const form = { id: randomUUID(), title, status, version: 1 }
    db.forms.push(form)
    return form
  },
  async get(id) {
    return db.forms.find((x) => x.id === id) || null
  },
  async update(id, patch) {
    const f = db.forms.find((x) => x.id === id)
    if (!f) return null
    if (patch.title) f.title = patch.title
    if (patch.status) f.status = patch.status
    f.version = (f.version || 1) + 1
    return f
  },
  async remove(id) {
    const idx = db.forms.findIndex((x) => x.id === id)
    if (idx === -1) return null
    const [removed] = db.forms.splice(idx, 1)
    return removed
  },
  async listFields(formId) {
    return (db.formFields[formId] || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  },
  async createField(formId, field) {
    const fields = db.formFields[formId] || (db.formFields[formId] = [])
    const order = typeof field.order === 'number' ? field.order : fields.length + 1
    const f = { ...field, fieldId: field.fieldId || randomUUID(), order }
    fields.push(f)
    return f
  },
  async updateField(formId, fieldId, patch) {
    const fields = db.formFields[formId] || []
    const f = fields.find((x) => x.fieldId === fieldId)
    if (!f) return null
    Object.assign(f, patch)
    return f
  },
  async removeField(formId, fieldId) {
    const fields = db.formFields[formId] || []
    const idx = fields.findIndex((x) => x.fieldId === fieldId)
    if (idx === -1) return null
    const [removed] = fields.splice(idx, 1)
    return removed
  },
}
