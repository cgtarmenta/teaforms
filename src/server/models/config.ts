import dynamoose from 'dynamoose'
import { fromIni } from '@aws-sdk/credential-providers'

// Configure Dynamoose based on environment
const IS_LOCAL = process.env.LOCAL_DEVELOPMENT === 'true'
const DDB_ENDPOINT = process.env.DDB_ENDPOINT
const AWS_REGION = process.env.AWS_REGION || 'eu-west-2'
const AWS_PROFILE = process.env.AWS_PROFILE

// Create DynamoDB instance
const ddb = new dynamoose.aws.ddb.DynamoDB({
  region: AWS_REGION,
  ...(IS_LOCAL && DDB_ENDPOINT ? {
    endpoint: DDB_ENDPOINT,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  } : {}),
  ...(AWS_PROFILE && !IS_LOCAL ? {
    credentials: fromIni({ profile: AWS_PROFILE })
  } : {})
})

// Set the DynamoDB instance
dynamoose.aws.ddb.set(ddb)

// Configure Dynamoose settings
dynamoose.Table.defaults.set({
  create: false, // Don't auto-create tables in production
  waitForActive: true,
  update: false
})

// In development, allow table creation
if (IS_LOCAL) {
  dynamoose.Table.defaults.set({
    create: true,
    waitForActive: {
      enabled: true,
      check: {
        timeout: 10000,
        frequency: 1000
      }
    }
  })
}

export default dynamoose
export { ddb }