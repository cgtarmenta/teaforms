import dynamoose from './config'
import { Document } from 'dynamoose/dist/Document'

// Field types for dynamic forms
export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'textarea' | 'scale'

// Field definition interface
export interface IFormField {
  fieldId: string
  label: string
  type: FieldType
  required: boolean
  order: number
  placeholder?: string
  helpText?: string
  options?: string[]
  min?: number
  max?: number
  defaultValue?: any
  validation?: {
    pattern?: string
    message?: string
  }
}

// Form interface
export interface IForm extends Document {
  PK: string
  SK: string
  formId: string
  title: string
  description?: string
  version: number
  status: 'draft' | 'active' | 'archived'
  fields: IFormField[]
  createdBy: string
  tags?: string[]
  category?: string
  isTemplate?: boolean
  createdAt: string
  updatedAt: string
  GSI1PK?: string // For querying forms by status
  GSI1SK?: string // For sorting by creation date
  GSI2PK?: string // For querying forms by creator
  GSI2SK?: string // For sorting
}

// Form Schema
const FormSchema = new dynamoose.Schema({
  PK: {
    type: String,
    hashKey: true,
    default: (form: IForm) => `FORM#${form.formId}`
  },
  SK: {
    type: String,
    rangeKey: true,
    default: 'METADATA'
  },
  formId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  fields: {
    type: Array,
    schema: [{
      type: Object,
      schema: {
        fieldId: String,
        label: String,
        type: {
          type: String,
          enum: ['text', 'number', 'select', 'checkbox', 'radio', 'date', 'time', 'textarea', 'scale']
        },
        required: Boolean,
        order: Number,
        placeholder: String,
        helpText: String,
        options: {
          type: Array,
          schema: [String]
        },
        min: Number,
        max: Number,
        defaultValue: dynamoose.type.ANY,
        validation: {
          type: Object,
          schema: {
            pattern: String,
            message: String
          }
        }
      }
    }],
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    schema: [String]
  },
  category: {
    type: String,
    required: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  GSI1PK: {
    type: String,
    index: {
      name: 'GSI1',
      type: 'global',
      rangeKey: 'GSI1SK'
    },
    default: (form: IForm) => `STATUS#${form.status}`
  },
  GSI1SK: {
    type: String,
    default: (form: IForm) => `FORM#${form.createdAt || new Date().toISOString()}`
  },
  GSI2PK: {
    type: String,
    index: {
      name: 'GSI2',
      type: 'global',
      rangeKey: 'GSI2SK'
    },
    default: (form: IForm) => `CREATOR#${form.createdBy}`
  },
  GSI2SK: {
    type: String,
    default: (form: IForm) => `FORM#${form.formId}`
  }
}, {
  timestamps: true
})

// Create and export the Form model
const Form = dynamoose.model<IForm>('Form', FormSchema, {
  tableName: process.env.DDB_TABLE || 'app_core'
})

// Helper methods
export class FormService {
  // Generate unique form ID
  static generateFormId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `form-${timestamp}-${random}`
  }

  // Create new form
  static async createForm(formData: Partial<IForm>): Promise<IForm> {
    const formId = formData.formId || FormService.generateFormId()
    
    // Ensure fields have proper IDs and order
    const fields = (formData.fields || []).map((field, index) => ({
      ...field,
      fieldId: field.fieldId || `field-${Date.now()}-${index}`,
      order: field.order ?? index
    }))
    
    const form = new Form({
      ...formData,
      formId,
      fields,
      PK: `FORM#${formId}`,
      SK: 'METADATA'
    })
    
    return await form.save()
  }

  // Get form by ID
  static async getFormById(formId: string): Promise<IForm | null> {
    try {
      const form = await Form.get({
        PK: `FORM#${formId}`,
        SK: 'METADATA'
      })
      return form
    } catch (error) {
      console.error('Error getting form by ID:', error)
      return null
    }
  }

  // Get forms by status
  static async getFormsByStatus(status: string): Promise<IForm[]> {
    try {
      const results = await Form.query('GSI1PK')
        .eq(`STATUS#${status}`)
        .using('GSI1')
        .sort('descending')
        .exec()
      return results
    } catch (error) {
      console.error('Error getting forms by status:', error)
      return []
    }
  }

  // Get forms by creator
  static async getFormsByCreator(userId: string): Promise<IForm[]> {
    try {
      const results = await Form.query('GSI2PK')
        .eq(`CREATOR#${userId}`)
        .using('GSI2')
        .exec()
      return results
    } catch (error) {
      console.error('Error getting forms by creator:', error)
      return []
    }
  }

  // Update form
  static async updateForm(formId: string, updates: Partial<IForm>): Promise<IForm | null> {
    try {
      // If updating fields, increment version
      if (updates.fields) {
        const currentForm = await FormService.getFormById(formId)
        if (currentForm) {
          updates.version = (currentForm.version || 1) + 1
        }
      }
      
      const form = await Form.update(
        {
          PK: `FORM#${formId}`,
          SK: 'METADATA'
        },
        updates
      )
      return form
    } catch (error) {
      console.error('Error updating form:', error)
      return null
    }
  }

  // Archive form
  static async archiveForm(formId: string): Promise<boolean> {
    try {
      await Form.update(
        {
          PK: `FORM#${formId}`,
          SK: 'METADATA'
        },
        {
          status: 'archived',
          updatedAt: new Date().toISOString()
        }
      )
      return true
    } catch (error) {
      console.error('Error archiving form:', error)
      return false
    }
  }

  // Get all active forms
  static async getAllActiveForms(): Promise<IForm[]> {
    try {
      const results = await Form.query('GSI1PK')
        .eq('STATUS#active')
        .using('GSI1')
        .sort('descending')
        .exec()
      return results
    } catch (error) {
      console.error('Error getting active forms:', error)
      return []
    }
  }

  // Clone form (create a copy)
  static async cloneForm(formId: string, newTitle: string, userId: string): Promise<IForm | null> {
    try {
      const originalForm = await FormService.getFormById(formId)
      if (!originalForm) return null
      
      const newFormData = {
        title: newTitle,
        description: originalForm.description,
        fields: originalForm.fields,
        status: 'draft' as const,
        version: 1,
        createdBy: userId,
        tags: originalForm.tags,
        category: originalForm.category,
        isTemplate: false
      }
      
      return await FormService.createForm(newFormData)
    } catch (error) {
      console.error('Error cloning form:', error)
      return null
    }
  }

  // Get form templates
  static async getTemplates(): Promise<IForm[]> {
    try {
      const results = await Form.scan()
        .where('SK').eq('METADATA')
        .where('isTemplate').eq(true)
        .where('status').eq('active')
        .exec()
      return results
    } catch (error) {
      console.error('Error getting form templates:', error)
      return []
    }
  }
}

export default Form