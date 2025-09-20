import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'
import { 
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
  type GetCommandInput,
  type PutCommandInput,
  type QueryCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type BatchWriteCommandInput,
  type ScanCommandInput
} from '@aws-sdk/lib-dynamodb'

// Configuration
const TABLE_NAME = process.env.DDB_TABLE || 'app_core'
const GSI1_NAME = process.env.DDB_GSI1 || 'GSI1'
const GSI2_NAME = process.env.DDB_GSI2 || 'GSI2'
const AWS_REGION = process.env.AWS_REGION || 'eu-west-2'
const IS_LOCAL = process.env.LOCAL_DEVELOPMENT === 'true'
const DDB_ENDPOINT = process.env.DDB_ENDPOINT

// Initialize DynamoDB client
const clientConfig: any = {
  region: AWS_REGION === 'local' ? 'eu-west-2' : AWS_REGION,
}

// Configure credentials based on environment
if (IS_LOCAL && DDB_ENDPOINT) {
  // Local development with DynamoDB Local
  clientConfig.endpoint = DDB_ENDPOINT
  clientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
} else if (process.env.AWS_PROFILE) {
  // Use AWS profile (e.g., cgtaa) for real DynamoDB
  clientConfig.credentials = fromIni({ profile: process.env.AWS_PROFILE })
} else if (process.env.AWS_ACCESS_KEY_ID) {
  // Use credentials from environment
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
}
// If no credentials are specified, AWS SDK will use default credential chain

const client = new DynamoDBClient(clientConfig)

// Create document client with marshalling options
export const ddbClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
    convertClassInstanceToMap: true
  },
  unmarshallOptions: {
    wrapNumbers: false
  }
})

// Entity types for the single-table design
export enum EntityType {
  USER = 'USER',
  FORM = 'FORM',
  FIELD = 'FIELD',
  EPISODE = 'EPISODE',
  AUDIT = 'AUDIT'
}

// Key builders
export const keys = {
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }),
  form: (formId: string) => ({
    PK: `FORM#${formId}`,
    SK: 'METADATA'
  }),
  formField: (formId: string, fieldId: string) => ({
    PK: `FORM#${formId}`,
    SK: `FIELD#${fieldId}`
  }),
  episode: (episodeId: string) => ({
    PK: `EPISODE#${episodeId}`,
    SK: 'METADATA'
  }),
  audit: (date: string, timestamp: string, action: string, actorId: string) => ({
    PK: `AUDIT#${date}`,
    SK: `${timestamp}#${action}#${actorId}`
  })
}

// GSI key builders
export const gsiKeys = {
  episodesByForm: (formId: string, timestamp?: string) => ({
    GSI1PK: `FORM#${formId}`,
    GSI1SK: timestamp ? `TS#${timestamp}` : undefined
  }),
  episodesByTeacher: (userId: string, timestamp?: string) => ({
    GSI2PK: `TEACHER#${userId}`,
    GSI2SK: timestamp ? `TS#${timestamp}` : undefined
  })
}

// Base repository class
export class DynamoRepository {
  protected tableName = TABLE_NAME
  protected gsi1Name = GSI1_NAME
  protected gsi2Name = GSI2_NAME

  async get<T = any>(key: { PK: string; SK: string }): Promise<T | null> {
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: key
    }
    
    const result = await ddbClient.send(new GetCommand(params))
    return result.Item as T || null
  }

  async put<T = any>(item: T & { PK: string; SK: string }): Promise<T> {
    const now = new Date().toISOString()
    const itemWithTimestamps = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: now
    }

    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: itemWithTimestamps
    }
    
    await ddbClient.send(new PutCommand(params))
    return itemWithTimestamps
  }

  async update(
    key: { PK: string; SK: string },
    updates: Record<string, any>
  ): Promise<void> {
    const updateExpressionParts: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, any> = {}

    // Add updated timestamp
    updates.updatedAt = new Date().toISOString()

    Object.entries(updates).forEach(([field, value], index) => {
      const nameKey = `#field${index}`
      const valueKey = `:value${index}`
      
      updateExpressionParts.push(`${nameKey} = ${valueKey}`)
      expressionAttributeNames[nameKey] = field
      expressionAttributeValues[valueKey] = value
    })

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }
    
    await ddbClient.send(new UpdateCommand(params))
  }

  async delete(key: { PK: string; SK: string }): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: key
    }
    
    await ddbClient.send(new DeleteCommand(params))
  }

  async query<T = any>(params: Omit<QueryCommandInput, 'TableName'>): Promise<T[]> {
    const result = await ddbClient.send(new QueryCommand({
      TableName: this.tableName,
      ...params
    }))
    
    return (result.Items || []) as T[]
  }

  async queryGSI1<T = any>(
    gsi1pk: string,
    options: {
      beginsWith?: string
      limit?: number
      sortOrder?: 'ASC' | 'DESC'
    } = {}
  ): Promise<T[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.gsi1Name,
      KeyConditionExpression: options.beginsWith
        ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
        : 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': gsi1pk,
        ...(options.beginsWith && { ':sk': options.beginsWith })
      },
      ScanIndexForward: options.sortOrder !== 'DESC',
      Limit: options.limit
    }
    
    return this.query<T>(params)
  }

  async queryGSI2<T = any>(
    gsi2pk: string,
    options: {
      beginsWith?: string
      limit?: number
      sortOrder?: 'ASC' | 'DESC'
    } = {}
  ): Promise<T[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: this.gsi2Name,
      KeyConditionExpression: options.beginsWith
        ? 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)'
        : 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': gsi2pk,
        ...(options.beginsWith && { ':sk': options.beginsWith })
      },
      ScanIndexForward: options.sortOrder !== 'DESC',
      Limit: options.limit
    }
    
    return this.query<T>(params)
  }

  async batchWrite(requests: Array<{ PutRequest?: { Item: any }, DeleteRequest?: { Key: any } }>): Promise<void> {
    // Add timestamps to put requests
    const processedRequests = requests.map(req => {
      if (req.PutRequest) {
        const now = new Date().toISOString()
        req.PutRequest.Item = {
          ...req.PutRequest.Item,
          createdAt: req.PutRequest.Item.createdAt || now,
          updatedAt: now
        }
      }
      return req
    })

    // Batch in chunks of 25 (DynamoDB limit)
    const chunks = []
    for (let i = 0; i < processedRequests.length; i += 25) {
      chunks.push(processedRequests.slice(i, i + 25))
    }

    for (const chunk of chunks) {
      const params: BatchWriteCommandInput = {
        RequestItems: {
          [this.tableName]: chunk
        }
      }
      
      await ddbClient.send(new BatchWriteCommand(params))
    }
  }

  async scan<T = any>(params: Omit<ScanCommandInput, 'TableName'> = {}): Promise<T[]> {
    const result = await ddbClient.send(new ScanCommand({
      TableName: this.tableName,
      ...params
    }))
    
    return (result.Items || []) as T[]
  }
}

// Export a default instance
export const db = new DynamoRepository()