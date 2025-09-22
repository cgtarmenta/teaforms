import { getCoreModel } from '../../db/models/core.js'
import { randomUUID } from 'node:crypto'

const Core = getCoreModel()

export const episodesDdbRepo = {
  async list() {
    const res = await Core.scan('PK').beginsWith('EPISODE#').exec()
    const items = res.filter((i) => i.SK === 'METADATA').map((i) => ({
      id: i.episodeId || i.PK.replace('EPISODE#', ''),
      formId: i.formId,
      timestamp: i.timestamp,
      context: i.context,
      createdBy: i.createdBy,
      data: i.data || {},
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }))
    return items
  },
  async create({ formId, timestamp = new Date().toISOString(), context = 'other', createdBy = 'USER#system', data = {}, ...rest }) {
    const episodeId = randomUUID()
    const item = await Core.create({
      PK: `EPISODE#${episodeId}`,
      SK: 'METADATA',
      episodeId,
      formId,
      timestamp,
      context,
      createdBy,
      GSI1PK: `FORM#${formId}`,
      GSI1SK: `TS#${timestamp}`,
      data,
      ...rest,
    })
    return {
      id: episodeId,
      formId: item.formId,
      timestamp: item.timestamp,
      context: item.context,
      createdBy: item.createdBy,
      data: item.data || {},
    }
  },
  async get(id) {
    const res = await Core.get({ PK: `EPISODE#${id}`, SK: 'METADATA' })
    if (!res) return null
    return {
      id,
      formId: res.formId,
      timestamp: res.timestamp,
      context: res.context,
      createdBy: res.createdBy,
      data: res.data || {},
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    }
  },
}
