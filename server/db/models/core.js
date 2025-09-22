import dynamoose from '../dynamoose.js'

export function getCoreModel() {
  const tableName = process.env.DDB_TABLE || 'app_core'
  const schema = new dynamoose.Schema(
    {
      PK: { type: String, hashKey: true },
      SK: { type: String, rangeKey: true },
      // GSIs (optional)
      GSI1PK: { type: String, index: { name: 'GSI1', type: 'global', rangeKey: 'GSI1SK' } },
      GSI1SK: { type: String },
      GSI2PK: { type: String, index: { name: 'GSI2', type: 'global', rangeKey: 'GSI2SK' } },
      GSI2SK: { type: String },
      // Attributes
      formId: String,
      episodeId: String,
      title: String,
      status: String,
      version: Number,
      createdBy: String,
      timestamp: String,
      context: String,
      trigger: String,
      response: String,
      duration: String,
      resolution: String,
      notes: String,
      createdAt: String,
      updatedAt: String,
    },
    { saveUnknown: true, timestamps: true }
  )

  return dynamoose.model(tableName, schema)
}

