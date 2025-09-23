export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const info = {
    ok: true,
    time: new Date().toISOString(),
    env: {
      node: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      region: process.env.APP_AWS_REGION || process.env.NUXT_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
      ddbTable: process.env.DDB_TABLE || process.env.NUXT_DDB_TABLE || '',
      dataBackend: process.env.DATA_BACKEND || process.env.NUXT_DATA_BACKEND || (process.env.USE_DYNAMODB || process.env.NUXT_USE_DYNAMODB || ''),
      hasSessionSecret: Boolean(process.env.SESSION_SECRET || process.env.NUXT_SESSION_SECRET || cfg.SESSION_SECRET),
    },
  }
  return info
})
