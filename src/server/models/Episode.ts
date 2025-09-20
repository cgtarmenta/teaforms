import dynamoose from './config'
import { Document } from 'dynamoose/dist/Document'

// Episode response interface
export interface IEpisodeResponse {
  fieldId: string
  value: any
}

// Episode interface
export interface IEpisode extends Document {
  PK: string
  SK: string
  episodeId: string
  formId: string
  formVersion: number
  responses: IEpisodeResponse[]
  submittedBy: string
  submittedFor?: string // Student/subject ID if applicable
  status: 'draft' | 'submitted' | 'reviewed' | 'archived'
  intensity?: 'low' | 'medium' | 'high' | 'critical'
  duration?: number // Duration in minutes
  location?: string
  notes?: string
  attachments?: string[] // S3 URLs
  reviewedBy?: string
  reviewedAt?: string
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  GSI1PK?: string // For querying episodes by form
  GSI1SK?: string // For sorting by date
  GSI2PK?: string // For querying episodes by submitter
  GSI2SK?: string // For sorting
}

// Episode Schema
const EpisodeSchema = new dynamoose.Schema({
  PK: {
    type: String,
    hashKey: true,
    default: (episode: IEpisode) => `EPISODE#${episode.episodeId}`
  },
  SK: {
    type: String,
    rangeKey: true,
    default: 'METADATA'
  },
  episodeId: {
    type: String,
    required: true
  },
  formId: {
    type: String,
    required: true
  },
  formVersion: {
    type: Number,
    required: true
  },
  responses: {
    type: Array,
    schema: [{
      type: Object,
      schema: {
        fieldId: String,
        value: dynamoose.type.ANY
      }
    }],
    required: true
  },
  submittedBy: {
    type: String,
    required: true
  },
  submittedFor: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'archived'],
    default: 'submitted'
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: false
  },
  duration: {
    type: Number,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  attachments: {
    type: Array,
    schema: [String]
  },
  reviewedBy: {
    type: String,
    required: false
  },
  reviewedAt: {
    type: String,
    required: false
  },
  tags: {
    type: Array,
    schema: [String]
  },
  metadata: {
    type: Object
  },
  GSI1PK: {
    type: String,
    index: {
      name: 'GSI1',
      type: 'global',
      rangeKey: 'GSI1SK'
    },
    default: (episode: IEpisode) => `FORM#${episode.formId}`
  },
  GSI1SK: {
    type: String,
    default: (episode: IEpisode) => `TS#${episode.createdAt || new Date().toISOString()}`
  },
  GSI2PK: {
    type: String,
    index: {
      name: 'GSI2',
      type: 'global',
      rangeKey: 'GSI2SK'
    },
    default: (episode: IEpisode) => `SUBMITTER#${episode.submittedBy}`
  },
  GSI2SK: {
    type: String,
    default: (episode: IEpisode) => `TS#${episode.createdAt || new Date().toISOString()}`
  }
}, {
  timestamps: true
})

// Create and export the Episode model
const Episode = dynamoose.model<IEpisode>('Episode', EpisodeSchema, {
  tableName: process.env.DDB_TABLE || 'app_core'
})

// Helper methods
export class EpisodeService {
  // Generate unique episode ID
  static generateEpisodeId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `ep-${timestamp}-${random}`
  }

  // Create new episode
  static async createEpisode(episodeData: Partial<IEpisode>): Promise<IEpisode> {
    const episodeId = episodeData.episodeId || EpisodeService.generateEpisodeId()
    
    const episode = new Episode({
      ...episodeData,
      episodeId,
      PK: `EPISODE#${episodeId}`,
      SK: 'METADATA',
      status: episodeData.status || 'submitted'
    })
    
    return await episode.save()
  }

  // Get episode by ID
  static async getEpisodeById(episodeId: string): Promise<IEpisode | null> {
    try {
      const episode = await Episode.get({
        PK: `EPISODE#${episodeId}`,
        SK: 'METADATA'
      })
      return episode
    } catch (error) {
      console.error('Error getting episode by ID:', error)
      return null
    }
  }

  // Get episodes by form
  static async getEpisodesByForm(formId: string, limit?: number): Promise<IEpisode[]> {
    try {
      let query = Episode.query('GSI1PK')
        .eq(`FORM#${formId}`)
        .using('GSI1')
        .sort('descending')
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const results = await query.exec()
      return results
    } catch (error) {
      console.error('Error getting episodes by form:', error)
      return []
    }
  }

  // Get episodes by submitter
  static async getEpisodesBySubmitter(userId: string, limit?: number): Promise<IEpisode[]> {
    try {
      let query = Episode.query('GSI2PK')
        .eq(`SUBMITTER#${userId}`)
        .using('GSI2')
        .sort('descending')
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const results = await query.exec()
      return results
    } catch (error) {
      console.error('Error getting episodes by submitter:', error)
      return []
    }
  }

  // Get episodes by date range
  static async getEpisodesByDateRange(
    startDate: string,
    endDate: string,
    formId?: string
  ): Promise<IEpisode[]> {
    try {
      let results: IEpisode[] = []
      
      if (formId) {
        // Query by form and date range
        results = await Episode.query('GSI1PK')
          .eq(`FORM#${formId}`)
          .where('GSI1SK')
          .between(`TS#${startDate}`, `TS#${endDate}`)
          .using('GSI1')
          .exec()
      } else {
        // Scan with date filter
        results = await Episode.scan()
          .where('SK').eq('METADATA')
          .where('createdAt').between(startDate, endDate)
          .exec()
      }
      
      return results
    } catch (error) {
      console.error('Error getting episodes by date range:', error)
      return []
    }
  }

  // Update episode
  static async updateEpisode(episodeId: string, updates: Partial<IEpisode>): Promise<IEpisode | null> {
    try {
      const episode = await Episode.update(
        {
          PK: `EPISODE#${episodeId}`,
          SK: 'METADATA'
        },
        updates
      )
      return episode
    } catch (error) {
      console.error('Error updating episode:', error)
      return null
    }
  }

  // Review episode
  static async reviewEpisode(
    episodeId: string,
    reviewerId: string,
    notes?: string
  ): Promise<IEpisode | null> {
    try {
      const episode = await Episode.update(
        {
          PK: `EPISODE#${episodeId}`,
          SK: 'METADATA'
        },
        {
          status: 'reviewed',
          reviewedBy: reviewerId,
          reviewedAt: new Date().toISOString(),
          ...(notes && { notes })
        }
      )
      return episode
    } catch (error) {
      console.error('Error reviewing episode:', error)
      return null
    }
  }

  // Archive episode
  static async archiveEpisode(episodeId: string): Promise<boolean> {
    try {
      await Episode.update(
        {
          PK: `EPISODE#${episodeId}`,
          SK: 'METADATA'
        },
        {
          status: 'archived',
          updatedAt: new Date().toISOString()
        }
      )
      return true
    } catch (error) {
      console.error('Error archiving episode:', error)
      return false
    }
  }

  // Get episodes statistics
  static async getEpisodeStatistics(
    formId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total: number
    byIntensity: Record<string, number>
    byStatus: Record<string, number>
    avgDuration: number
  }> {
    try {
      let episodes: IEpisode[] = []
      
      if (formId) {
        episodes = await EpisodeService.getEpisodesByForm(formId)
      } else if (startDate && endDate) {
        episodes = await EpisodeService.getEpisodesByDateRange(startDate, endDate)
      } else {
        // Get all episodes (be careful with large datasets)
        episodes = await Episode.scan()
          .where('SK').eq('METADATA')
          .exec()
      }
      
      const stats = {
        total: episodes.length,
        byIntensity: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        avgDuration: 0
      }
      
      let totalDuration = 0
      let durationCount = 0
      
      episodes.forEach(episode => {
        // Count by intensity
        if (episode.intensity) {
          stats.byIntensity[episode.intensity] = (stats.byIntensity[episode.intensity] || 0) + 1
        }
        
        // Count by status
        stats.byStatus[episode.status] = (stats.byStatus[episode.status] || 0) + 1
        
        // Calculate average duration
        if (episode.duration) {
          totalDuration += episode.duration
          durationCount++
        }
      })
      
      if (durationCount > 0) {
        stats.avgDuration = totalDuration / durationCount
      }
      
      return stats
    } catch (error) {
      console.error('Error getting episode statistics:', error)
      return {
        total: 0,
        byIntensity: {},
        byStatus: {},
        avgDuration: 0
      }
    }
  }

  // Search episodes
  static async searchEpisodes(criteria: {
    formId?: string
    submittedBy?: string
    status?: string
    intensity?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<IEpisode[]> {
    try {
      let scan = Episode.scan().where('SK').eq('METADATA')
      
      if (criteria.status) {
        scan = scan.where('status').eq(criteria.status)
      }
      
      if (criteria.intensity) {
        scan = scan.where('intensity').eq(criteria.intensity)
      }
      
      if (criteria.startDate && criteria.endDate) {
        scan = scan.where('createdAt').between(criteria.startDate, criteria.endDate)
      }
      
      if (criteria.limit) {
        scan = scan.limit(criteria.limit)
      }
      
      const results = await scan.exec()
      
      // Further filter if needed
      return results.filter(episode => {
        if (criteria.formId && episode.formId !== criteria.formId) return false
        if (criteria.submittedBy && episode.submittedBy !== criteria.submittedBy) return false
        return true
      })
    } catch (error) {
      console.error('Error searching episodes:', error)
      return []
    }
  }
}

export default Episode