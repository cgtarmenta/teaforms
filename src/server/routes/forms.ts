import { Router, Request, Response } from 'express'
import { FormService } from '../models/Form'
import { authMiddleware } from '../middleware/auth'
import { authorize } from '../middleware/authorize'

const router = Router()

// Get all forms (with optional filters)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, category, createdBy } = req.query
    
    let forms = []
    
    if (status) {
      forms = await FormService.getFormsByStatus(status as string)
    } else if (createdBy) {
      forms = await FormService.getFormsByCreator(createdBy as string)
    } else {
      forms = await FormService.getAllActiveForms()
    }
    
    // Apply additional filters if needed
    if (category) {
      forms = forms.filter(form => form.category === category)
    }
    
    res.json(forms)
  } catch (error) {
    console.error('Error fetching forms:', error)
    res.status(500).json({ message: 'Error fetching forms' })
  }
})

// Get form by ID
router.get('/:formId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { formId } = req.params
    const form = await FormService.getFormById(formId)
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' })
    }
    
    res.json(form)
  } catch (error) {
    console.error('Error fetching form:', error)
    res.status(500).json({ message: 'Error fetching form' })
  }
})

// Create new form
router.post('/', authMiddleware, authorize(['admin', 'sysadmin']), async (req: Request, res: Response) => {
  try {
    const formData = {
      ...req.body,
      createdBy: req.user.userId
    }
    
    const form = await FormService.createForm(formData)
    res.status(201).json(form)
  } catch (error) {
    console.error('Error creating form:', error)
    res.status(500).json({ message: 'Error creating form' })
  }
})

// Update form
router.put('/:formId', authMiddleware, authorize(['admin', 'sysadmin']), async (req: Request, res: Response) => {
  try {
    const { formId } = req.params
    const updates = req.body
    
    const form = await FormService.updateForm(formId, updates)
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' })
    }
    
    res.json(form)
  } catch (error) {
    console.error('Error updating form:', error)
    res.status(500).json({ message: 'Error updating form' })
  }
})

// Archive form
router.put('/:formId/archive', authMiddleware, authorize(['admin', 'sysadmin']), async (req: Request, res: Response) => {
  try {
    const { formId } = req.params
    const success = await FormService.archiveForm(formId)
    
    if (!success) {
      return res.status(404).json({ message: 'Form not found' })
    }
    
    res.json({ message: 'Form archived successfully' })
  } catch (error) {
    console.error('Error archiving form:', error)
    res.status(500).json({ message: 'Error archiving form' })
  }
})

// Duplicate form
router.post('/:formId/duplicate', authMiddleware, authorize(['admin', 'sysadmin']), async (req: Request, res: Response) => {
  try {
    const { formId } = req.params
    const { title } = req.body
    
    const newForm = await FormService.cloneForm(
      formId,
      title || 'Copy of form',
      req.user.userId
    )
    
    if (!newForm) {
      return res.status(404).json({ message: 'Form not found' })
    }
    
    res.status(201).json(newForm)
  } catch (error) {
    console.error('Error duplicating form:', error)
    res.status(500).json({ message: 'Error duplicating form' })
  }
})

// Get form templates
router.get('/templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const templates = await FormService.getTemplates()
    res.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({ message: 'Error fetching templates' })
  }
})

export default router