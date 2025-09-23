#!/usr/bin/env node
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTableCommand } from '@aws-sdk/client-dynamodb'

const tableName = process.env.DDB_TABLE || 'app_core'
const region = process.env.APP_AWS_REGION || process.env.NUXT_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
const client = new DynamoDBClient({ region })

async function ensureTable() {
  try {
    const out = await client.send(new DescribeTableCommand({ TableName: tableName }))
    console.log(`[ddb] Table exists: ${out.Table?.TableName}`)
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') {
      console.log(`[ddb] Creating table ${tableName}...`)
      await client.send(new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
          { AttributeName: 'GSI2PK', AttributeType: 'S' },
          { AttributeName: 'GSI2SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'GSI2',
            KeySchema: [
              { AttributeName: 'GSI2PK', KeyType: 'HASH' },
              { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      }))
      console.log('[ddb] Table creation initiated (PAY_PER_REQUEST).')
    } else {
      throw e
    }
  }
}

ensureTable().catch((e) => {
  console.error('[ddb] Error:', e)
  process.exit(1)
})
