import { getCoreModel } from '../../db/models/core.js'
import { randomUUID } from 'node:crypto'

const Core = getCoreModel()

export const formsDdbRepo = {
  async list() {
    // Scan forms (PK begins with FORM#)
    const res = await Core.scan('PK').beginsWith('FORM#').exec()
    // Only return METADATA items
    const items = res.filter((i) => i.SK === 'METADATA').map((i) => ({
      id: i.formId || i.PK.replace('FORM#', ''),
      title: i.title,
      status: i.status,
      version: i.version,
      createdBy: i.createdBy,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }))
    return items
  },
  async create({ title, status = 'active', createdBy = 'USER#system' }) {
    const formId = randomUUID()
    const item = await Core.create({
      PK: `FORM#${formId}`,
      SK: 'METADATA',
      formId,
      title,
      status,
      version: 1,
      createdBy,
    })
    return { id: formId, title: item.title, status: item.status, version: item.version, createdBy }
  },
  async get(id) {
    const res = await Core.get({ PK: `FORM#${id}`, SK: 'METADATA' })
    if (!res) return null
    return {
      id,
      title: res.title,
      status: res.status,
      version: res.version,
      createdBy: res.createdBy,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    }
  },
  async update(id, patch) {
    const res = await Core.update({ PK: `FORM#${id}`, SK: 'METADATA' }, (old) => ({
      ...old,
      ...(patch.title ? { title: patch.title } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      version: (old?.version || 1) + 1,
    }))
    return res ? { id, title: res.title, status: res.status, version: res.version } : null
  },
  async remove(id) {
    // For MVP delete METADATA only
    const existing = await Core.get({ PK: `FORM#${id}`, SK: 'METADATA' })
    if (!existing) return null
    await Core.delete({ PK: `FORM#${id}`, SK: 'METADATA' })
    return { id, title: existing.title, status: existing.status, version: existing.version }
  },
  async listFields(formId) {
    const res = await Core.query('PK').eq(`FORM#${formId}`).where('SK').beginsWith('FIELD#').exec()
    return res
      .map((i) => ({
        fieldId: i.fieldId || i.SK.replace('FIELD#', ''),
        label: i.label,
        type: i.type,
        required: !!i.required,
        options: i.options || [],
        default: i.default,
        validation: i.validation || {},
        order: i.order || 0,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  },
  async createField(formId, field) {
    const fieldId = field.fieldId || randomUUID()
    const item = await Core.create({
      PK: `FORM#${formId}`,
      SK: `FIELD#${fieldId}`,
      fieldId,
      label: field.label,
      type: field.type,
      required: !!field.required,
      options: field.options || [],
      default: field.default,
      validation: field.validation || {},
      order: typeof field.order === 'number' ? field.order : Date.now(),
    })
    return {
      fieldId,
      label: item.label,
      type: item.type,
      required: item.required,
      options: item.options,
      default: item.default,
      validation: item.validation,
      order: item.order,
    }
  },
  async updateField(formId, fieldId, patch) {
    const res = await Core.update(
      { PK: `FORM#${formId}`, SK: `FIELD#${fieldId}` },
      (old) => ({ ...old, ...patch })
    )
    return res
      ? {
          fieldId,
          label: res.label,
          type: res.type,
          required: res.required,
          options: res.options,
          default: res.default,
          validation: res.validation,
          order: res.order,
        }
      : null
  },
  async removeField(formId, fieldId) {
    const existing = await Core.get({ PK: `FORM#${formId}`, SK: `FIELD#${fieldId}` })
    if (!existing) return null
    await Core.delete({ PK: `FORM#${formId}`, SK: `FIELD#${fieldId}` })
    return {
      fieldId,
      label: existing.label,
      type: existing.type,
    }
  },
}
