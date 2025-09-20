import type { Express } from 'express'
import { authenticate, authorize, createAuditLog } from '../../auth'
import { db, keys, EntityType } from '../../ddb'
import { v4 as uuidv4 } from 'uuid'

export interface Form {
  PK: string
  SK: string
  formId: string
  title: string
  description?: string
  createdBy: string
  version: number
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface FormField {
  PK: string
  SK: string
  fieldId: string
  formId: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'number' | 'radio' | 'checkbox'
  required: boolean
  order: number
  options?: string[]
  default?: any
  validation?: {
    regex?: string
    min?: number
    max?: number
    maxLength?: number
  }
}

export function setupFormRoutes(app: Express) {
  // List forms (accessible to all authenticated users)
  app.get('/api/forms', authenticate, async (req, res) => {
    try {
      const { status = 'active' } = req.query

      // Query all forms
      const forms = await db.query<Form>({
        KeyConditionExpression: 'begins_with(PK, :pk) AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'FORM#',
          ':sk': 'METADATA'
        }
      })

      // Filter by status
      const filteredForms = forms.filter(form => 
        status === 'all' || form.status === status
      )

      // For teachers, only show active forms
      if (req.user?.role === 'teacher') {
        return res.json(filteredForms.filter(f => f.status === 'active'))
      }

      res.json(filteredForms)
    } catch (error) {
      console.error('Failed to list forms:', error)
      res.status(500).json({ error: 'Failed to list forms' })
    }
  })

  // Get form with fields
  app.get('/api/forms/:formId', authenticate, async (req, res) => {
    try {
      const { formId } = req.params

      // Get form metadata
      const form = await db.get<Form>(keys.form(formId))
      
      if (!form) {
        return res.status(404).json({ error: 'Form not found' })
      }

      // Get form fields
      const fields = await db.query<FormField>({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `FORM#${formId}`,
          ':sk': 'FIELD#'
        }
      })

      // Sort fields by order
      fields.sort((a, b) => a.order - b.order)

      res.json({
        ...form,
        fields
      })
    } catch (error) {
      console.error('Failed to get form:', error)
      res.status(500).json({ error: 'Failed to get form' })
    }
  })

  // Create form (clinician only)
  app.post('/api/forms', authenticate, authorize('clinician', 'sysadmin'), async (req, res) => {
    try {
      const { title, description, fields } = req.body

      if (!title || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ error: 'Title and fields are required' })
      }

      const formId = uuidv4()
      const now = new Date().toISOString()

      // Create form metadata
      const form: Form = {
        ...keys.form(formId),
        formId,
        title,
        description,
        createdBy: `USER#${req.user!.sub}`,
        version: 1,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }

      // Prepare batch write
      const requests = [
        { PutRequest: { Item: form } }
      ]

      // Add fields
      fields.forEach((field, index) => {
        const fieldId = uuidv4()
        const formField: FormField = {
          PK: `FORM#${formId}`,
          SK: `FIELD#${fieldId}`,
          fieldId,
          formId,
          label: field.label,
          type: field.type,
          required: field.required || false,
          order: index,
          options: field.options,
          default: field.default,
          validation: field.validation
        }
        requests.push({ PutRequest: { Item: formField } })
      })

      await db.batchWrite(requests)

      // Audit log
      await createAuditLog('FORM_CREATED', req.user!.sub, {
        formId,
        title,
        fieldCount: fields.length,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(201).json(form)
    } catch (error) {
      console.error('Failed to create form:', error)
      res.status(500).json({ error: 'Failed to create form' })
    }
  })

  // Update form (clinician only)
  app.put('/api/forms/:formId', authenticate, authorize('clinician', 'sysadmin'), async (req, res) => {
    try {
      const { formId } = req.params
      const { title, description, status, fields } = req.body

      // Get existing form
      const existingForm = await db.get<Form>(keys.form(formId))
      
      if (!existingForm) {
        return res.status(404).json({ error: 'Form not found' })
      }

      // Update form metadata
      const updates: any = {}
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description
      if (status !== undefined) updates.status = status
      if (Object.keys(updates).length > 0) {
        updates.version = existingForm.version + 1
        await db.update(keys.form(formId), updates)
      }

      // Update fields if provided
      if (fields && Array.isArray(fields)) {
        // Delete existing fields
        const existingFields = await db.query<FormField>({
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `FORM#${formId}`,
            ':sk': 'FIELD#'
          }
        })

        const deleteRequests = existingFields.map(field => ({
          DeleteRequest: { Key: { PK: field.PK, SK: field.SK } }
        }))

        // Add new fields
        const putRequests = fields.map((field, index) => {
          const fieldId = field.fieldId || uuidv4()
          const formField: FormField = {
            PK: `FORM#${formId}`,
            SK: `FIELD#${fieldId}`,
            fieldId,
            formId,
            label: field.label,
            type: field.type,
            required: field.required || false,
            order: index,
            options: field.options,
            default: field.default,
            validation: field.validation
          }
          return { PutRequest: { Item: formField } }
        })

        if (deleteRequests.length > 0 || putRequests.length > 0) {
          await db.batchWrite([...deleteRequests, ...putRequests])
        }
      }

      // Audit log
      await createAuditLog('FORM_UPDATED', req.user!.sub, {
        formId,
        updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, formId })
    } catch (error) {
      console.error('Failed to update form:', error)
      res.status(500).json({ error: 'Failed to update form' })
    }
  })

  // Archive form (clinician only)
  app.delete('/api/forms/:formId', authenticate, authorize('clinician', 'sysadmin'), async (req, res) => {
    try {
      const { formId } = req.params

      // Check if form exists
      const form = await db.get<Form>(keys.form(formId))
      
      if (!form) {
        return res.status(404).json({ error: 'Form not found' })
      }

      // Archive instead of delete
      await db.update(keys.form(formId), { status: 'archived' })

      // Audit log
      await createAuditLog('FORM_ARCHIVED', req.user!.sub, {
        formId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, formId })
    } catch (error) {
      console.error('Failed to archive form:', error)
      res.status(500).json({ error: 'Failed to archive form' })
    }
  })
}