import { getUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUser(event)
  return { user }
})

