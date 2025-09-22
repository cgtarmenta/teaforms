import { db } from '../../db/memory.js'
import { randomUUID } from 'node:crypto'

export const episodesMemoryRepo = {
  async list() {
    return db.episodes
  },
  async create({ formId, timestamp = new Date().toISOString(), context = 'other', createdBy, data, ...rest }) {
    const episode = { id: randomUUID(), formId, timestamp, context, createdBy, data: data || {}, ...rest }
    db.episodes.push(episode)
    return episode
  },
  async get(id) {
    return db.episodes.find((x) => x.id === id) || null
  },
}
