import dynamoose from 'dynamoose'

function truthy(val) {
  if (!val) return false
  return ['1','true','yes','on'].includes(String(val).toLowerCase())
}

export async function configureDynamoose() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
  const endpoint = process.env.DDB_ENDPOINT || process.env.DYNAMODB_ENDPOINT

  if (endpoint) {
    try {
      // Prefer built-in helper if available
      if (dynamoose?.aws?.ddb?.local) {
        dynamoose.aws.ddb.local(endpoint)
      } else {
        const { DynamoDB } = await import('@aws-sdk/client-dynamodb')
        const ddb = new DynamoDB({ region, endpoint })
        dynamoose.aws.ddb.set(ddb)
      }
    } catch (e) {
      console.warn('[dynamoose] Failed to configure local endpoint, falling back to default SDK:', e?.message || e)
    }
  } else {
    // Default SDK config (IAM/environment)
    // For aws-sdk-v3 this is enough; region picked from env/role
  }

  // Global options
  dynamoose.model.defaults.set({
    waitForActive: true,
    create: truthy(process.env.DDB_CREATE_TABLES), // enable only when explicitly requested
  })
  return dynamoose
}

export default dynamoose
