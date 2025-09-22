import { db } from '../../db/memory.js'
import { randomUUID } from 'node:crypto'

export const usersMemoryRepo = {
  async list() {
    return db.users
  },
  async create({ email, role = 'teacher', active = true }) {
    const id = randomUUID()
    const user = { id, email, role, active }
    db.users.push(user)
    return user
  },
  async update(id, patch) {
    const u = db.users.find((x) => x.id === id)
    if (!u) return null
    Object.assign(u, patch)
    return u
  },
  async remove(id) {
    const idx = db.users.findIndex((x) => x.id === id)
    if (idx === -1) return null
    const [removed] = db.users.splice(idx, 1)
    return removed
  },
}

