import type { Express } from 'express'
import { authenticate, authorize, createAuditLog, canAccess } from '../../auth.js'
import { db, keys, gsiKeys } from '../../ddb.js'
import { v4 as uuidv4 } from 'uuid'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { exportToPDF } from '../../utils/pdf-export.js'
import { exportToXML } from '../../utils/xml-export.js'

export interface Episode {
  PK: string
  SK: string
  episodeId: string
  formId: string
  formTitle?: string
  createdBy: string
  teacherId: string
  teacherName: string
  timestamp: string
  context: 'class' | 'recess' | 'lunch' | 'hall' | 'other'
  trigger: string
  response: string
  duration: string
  resolution: string
  notes?: string
  formResponses?: Record<string, any>
  GSI1PK: string
  GSI1SK: string
  GSI2PK: string
  GSI2SK: string
  createdAt: string
  updatedAt: string
}

export function setupEpisodeRoutes(app: Express) {
  // List episodes (filtered by role)
  app.get('/api/episodes', authenticate, async (req, res) => {
    try {
      const { 
        mine,
        formId,
        teacherId,
        startDate,
        endDate,
        context,
        limit = 50,
        lastEvaluatedKey
      } = req.query

      let episodes: Episode[] = []

      // Teachers can only see their own episodes
      if (req.user!.role === 'teacher' || mine === 'true') {
        const gsiKey = gsiKeys.episodesByTeacher(req.user!.sub)
        episodes = await db.queryGSI2<Episode>(gsiKey.GSI2PK, {
          limit: Number(limit),
          sortOrder: 'DESC'
        })
      } 
      // Clinicians and sysadmins can filter
      else if (req.user!.role === 'clinician' || req.user!.role === 'sysadmin') {
        if (formId) {
          const gsiKey = gsiKeys.episodesByForm(formId as string)
          episodes = await db.queryGSI1<Episode>(gsiKey.GSI1PK, {
            limit: Number(limit),
            sortOrder: 'DESC'
          })
        } else if (teacherId) {
          const gsiKey = gsiKeys.episodesByTeacher(teacherId as string)
          episodes = await db.queryGSI2<Episode>(gsiKey.GSI2PK, {
            limit: Number(limit),
            sortOrder: 'DESC'
          })
        } else {
          // Scan all episodes (expensive - should be paginated)
          episodes = await db.scan<Episode>({
            FilterExpression: 'SK = :sk',
            ExpressionAttributeValues: {
              ':sk': 'METADATA'
            },
            Limit: Number(limit)
          })
        }
      } else {
        return res.status(403).json({ error: 'Forbidden' })
      }

      // Apply additional filters
      if (startDate || endDate) {
        const start = startDate ? startOfDay(parseISO(startDate as string)) : null
        const end = endDate ? endOfDay(parseISO(endDate as string)) : null
        
        episodes = episodes.filter(ep => {
          const epDate = parseISO(ep.timestamp)
          if (start && epDate < start) return false
          if (end && epDate > end) return false
          return true
        })
      }

      if (context) {
        episodes = episodes.filter(ep => ep.context === context)
      }

      res.json({
        episodes,
        count: episodes.length,
        lastEvaluatedKey: null // Implement pagination if needed
      })
    } catch (error) {
      console.error('Failed to list episodes:', error)
      res.status(500).json({ error: 'Failed to list episodes' })
    }
  })

  // Get single episode
  app.get('/api/episodes/:episodeId', authenticate, async (req, res) => {
    try {
      const { episodeId } = req.params
      
      const episode = await db.get<Episode>(keys.episode(episodeId))
      
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      // Check access
      if (!canAccess(req.user!, {
        type: 'episode',
        ownerId: episode.teacherId
      })) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json(episode)
    } catch (error) {
      console.error('Failed to get episode:', error)
      res.status(500).json({ error: 'Failed to get episode' })
    }
  })

  // Create episode (teacher only)
  app.post('/api/episodes', authenticate, authorize('teacher'), async (req, res) => {
    try {
      const {
        formId,
        timestamp,
        context,
        trigger,
        response,
        duration,
        resolution,
        notes,
        formResponses
      } = req.body

      // Validation
      if (!formId || !timestamp || !context || !trigger || !response) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['formId', 'timestamp', 'context', 'trigger', 'response']
        })
      }

      // Verify form exists
      const form = await db.get(keys.form(formId))
      if (!form) {
        return res.status(404).json({ error: 'Form not found' })
      }

      const episodeId = uuidv4()
      const now = new Date().toISOString()
      const teacherProfile = req.userProfile!

      const episode: Episode = {
        ...keys.episode(episodeId),
        episodeId,
        formId,
        formTitle: form.title,
        createdBy: `USER#${req.user!.sub}`,
        teacherId: req.user!.sub,
        teacherName: `${teacherProfile.firstName} ${teacherProfile.lastName}`,
        timestamp,
        context,
        trigger,
        response,
        duration: duration || '',
        resolution: resolution || '',
        notes,
        formResponses,
        ...gsiKeys.episodesByForm(formId, timestamp),
        ...gsiKeys.episodesByTeacher(req.user!.sub, timestamp),
        createdAt: now,
        updatedAt: now
      }

      await db.put(episode)

      // Audit log
      await createAuditLog('EPISODE_CREATED', req.user!.sub, {
        episodeId,
        formId,
        context,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(201).json(episode)
    } catch (error) {
      console.error('Failed to create episode:', error)
      res.status(500).json({ error: 'Failed to create episode' })
    }
  })

  // Update episode (teacher - own episodes only)
  app.put('/api/episodes/:episodeId', authenticate, async (req, res) => {
    try {
      const { episodeId } = req.params
      const updates = req.body

      // Get existing episode
      const episode = await db.get<Episode>(keys.episode(episodeId))
      
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      // Check ownership
      if (episode.teacherId !== req.user!.sub && req.user!.role !== 'sysadmin') {
        return res.status(403).json({ error: 'Cannot update episode created by another user' })
      }

      // Remove protected fields from updates
      delete updates.episodeId
      delete updates.PK
      delete updates.SK
      delete updates.createdBy
      delete updates.teacherId
      delete updates.createdAt

      // Update episode
      await db.update(keys.episode(episodeId), updates)

      // Audit log
      await createAuditLog('EPISODE_UPDATED', req.user!.sub, {
        episodeId,
        updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, episodeId })
    } catch (error) {
      console.error('Failed to update episode:', error)
      res.status(500).json({ error: 'Failed to update episode' })
    }
  })

  // Delete episode (teacher - own episodes only, or sysadmin)
  app.delete('/api/episodes/:episodeId', authenticate, async (req, res) => {
    try {
      const { episodeId } = req.params

      // Get existing episode
      const episode = await db.get<Episode>(keys.episode(episodeId))
      
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' })
      }

      // Check ownership or admin
      if (episode.teacherId !== req.user!.sub && req.user!.role !== 'sysadmin') {
        return res.status(403).json({ error: 'Cannot delete episode created by another user' })
      }

      await db.delete(keys.episode(episodeId))

      // Audit log
      await createAuditLog('EPISODE_DELETED', req.user!.sub, {
        episodeId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, episodeId })
    } catch (error) {
      console.error('Failed to delete episode:', error)
      res.status(500).json({ error: 'Failed to delete episode' })
    }
  })

  // Export episodes to PDF
  app.get('/api/episodes/export.pdf', authenticate, authorize('clinician', 'sysadmin'), async (req, res) => {
    try {
      const { formId, teacherId, startDate, endDate } = req.query
      
      // Get episodes based on filters
      let episodes: Episode[] = []
      
      if (formId) {
        const gsiKey = gsiKeys.episodesByForm(formId as string)
        episodes = await db.queryGSI1<Episode>(gsiKey.GSI1PK, {
          sortOrder: 'DESC'
        })
      } else if (teacherId) {
        const gsiKey = gsiKeys.episodesByTeacher(teacherId as string)
        episodes = await db.queryGSI2<Episode>(gsiKey.GSI2PK, {
          sortOrder: 'DESC'
        })
      } else {
        episodes = await db.scan<Episode>({
          FilterExpression: 'SK = :sk',
          ExpressionAttributeValues: {
            ':sk': 'METADATA'
          }
        })
      }

      // Apply date filters
      if (startDate || endDate) {
        const start = startDate ? startOfDay(parseISO(startDate as string)) : null
        const end = endDate ? endOfDay(parseISO(endDate as string)) : null
        
        episodes = episodes.filter(ep => {
          const epDate = parseISO(ep.timestamp)
          if (start && epDate < start) return false
          if (end && epDate > end) return false
          return true
        })
      }

      // Generate PDF
      const pdfBuffer = await exportToPDF(episodes, {
        title: 'Behavioral Episodes Report',
        startDate: startDate as string,
        endDate: endDate as string,
        generatedBy: `${req.userProfile!.firstName} ${req.userProfile!.lastName}`
      })

      // Audit log
      await createAuditLog('EPISODES_EXPORTED_PDF', req.user!.sub, {
        count: episodes.length,
        filters: { formId, teacherId, startDate, endDate },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="episodes-${Date.now()}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      console.error('Failed to export episodes to PDF:', error)
      res.status(500).json({ error: 'Failed to export episodes' })
    }
  })

  // Export episodes to XML
  app.get('/api/episodes/export.xml', authenticate, authorize('clinician', 'sysadmin'), async (req, res) => {
    try {
      const { formId, teacherId, startDate, endDate } = req.query
      
      // Get episodes (same as PDF export)
      let episodes: Episode[] = []
      
      if (formId) {
        const gsiKey = gsiKeys.episodesByForm(formId as string)
        episodes = await db.queryGSI1<Episode>(gsiKey.GSI1PK, {
          sortOrder: 'DESC'
        })
      } else if (teacherId) {
        const gsiKey = gsiKeys.episodesByTeacher(teacherId as string)
        episodes = await db.queryGSI2<Episode>(gsiKey.GSI2PK, {
          sortOrder: 'DESC'
        })
      } else {
        episodes = await db.scan<Episode>({
          FilterExpression: 'SK = :sk',
          ExpressionAttributeValues: {
            ':sk': 'METADATA'
          }
        })
      }

      // Apply date filters
      if (startDate || endDate) {
        const start = startDate ? startOfDay(parseISO(startDate as string)) : null
        const end = endDate ? endOfDay(parseISO(endDate as string)) : null
        
        episodes = episodes.filter(ep => {
          const epDate = parseISO(ep.timestamp)
          if (start && epDate < start) return false
          if (end && epDate > end) return false
          return true
        })
      }

      // Generate XML
      const xmlString = await exportToXML(episodes)

      // Audit log
      await createAuditLog('EPISODES_EXPORTED_XML', req.user!.sub, {
        count: episodes.length,
        filters: { formId, teacherId, startDate, endDate },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.setHeader('Content-Type', 'application/xml')
      res.setHeader('Content-Disposition', `attachment; filename="episodes-${Date.now()}.xml"`)
      res.send(xmlString)
    } catch (error) {
      console.error('Failed to export episodes to XML:', error)
      res.status(500).json({ error: 'Failed to export episodes' })
    }
  })
}