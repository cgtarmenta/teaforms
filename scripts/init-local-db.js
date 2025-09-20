#!/usr/bin/env node

/**
 * Initialize local DynamoDB tables for development
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const IS_DOCKER = process.env.DOCKER_ENV === 'true'
const ENDPOINT = process.env.DDB_ENDPOINT || (IS_DOCKER ? 'http://dynamodb:8000' : 'http://localhost:8000')

const client = new DynamoDBClient({
  region: 'eu-west-2',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

async function createTable() {
  const tableName = 'app_core'
  
  try {
    console.log(`Connecting to DynamoDB at ${ENDPOINT}...`)
    
    // Check if table exists with timeout
    const listCommand = new ListTablesCommand({})
    const { TableNames } = await Promise.race([
      client.send(listCommand),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ])
    
    if (TableNames?.includes(tableName)) {
      console.log(`Table ${tableName} already exists`)
      return
    }
    
    // Create table
    const params = {
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
    
    await client.send(new CreateTableCommand(params))
    console.log(`Table ${tableName} created successfully`)
    
    // Wait a moment for table to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create initial admin user
    await createInitialData()
    
  } catch (error) {
    console.error('Error creating table:', error)
    throw error
  }
}

async function createInitialData() {
  
  const docClient = DynamoDBDocumentClient.from(client)
  
  // Create default admin user
  const adminUser = {
    PK: 'USER#admin-001',
    SK: 'PROFILE',
    userId: 'admin-001',
    role: 'sysadmin',
    email: 'admin@teaforms.local',
    firstName: 'System',
    lastName: 'Administrator',
    phone: '+34600000000',
    locale: 'es-ES',
    timezone: 'Europe/Madrid',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  await docClient.send(new PutCommand({
    TableName: 'app_core',
    Item: adminUser
  }))
  
  console.log('Initial admin user created: admin@teaforms.local')
  
  // Create sample form
  const sampleForm = {
    PK: 'FORM#sample-001',
    SK: 'METADATA',
    formId: 'sample-001',
    title: 'Formulario de Episodio Básico',
    description: 'Formulario estándar para registro de episodios conductuales',
    createdBy: 'USER#admin-001',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  await docClient.send(new PutCommand({
    TableName: 'app_core',
    Item: sampleForm
  }))
  
  // Create form fields
  const fields = [
    {
      PK: 'FORM#sample-001',
      SK: 'FIELD#field-001',
      fieldId: 'field-001',
      formId: 'sample-001',
      label: 'Intensidad del episodio',
      type: 'select',
      required: true,
      order: 0,
      options: ['Leve', 'Moderado', 'Severo'],
      default: 'Moderado'
    },
    {
      PK: 'FORM#sample-001',
      SK: 'FIELD#field-002',
      fieldId: 'field-002',
      formId: 'sample-001',
      label: 'Intervenciones aplicadas',
      type: 'checkbox',
      required: false,
      order: 1,
      options: ['Redirección verbal', 'Tiempo fuera', 'Refuerzo positivo', 'Cambio de actividad']
    }
  ]
  
  for (const field of fields) {
    await docClient.send(new PutCommand({
      TableName: 'app_core',
      Item: field
    }))
  }
  
  console.log('Sample form created: Formulario de Episodio Básico')
}

// Run initialization
createTable()
  .then(() => {
    console.log('Local database initialization complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })