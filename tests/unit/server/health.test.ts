import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import type { Express } from 'express'

describe('Server Health Check', () => {
  let app: Express

  beforeAll(() => {
    app = express()
    
    // Setup health endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test'
      })
    })
    
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        authenticated: false
      })
    })
  })

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('environment')
    })
  })

  describe('GET /api/health', () => {
    it('should return 200 with API health status', async () => {
      const response = await request(app).get('/api/health')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('authenticated', false)
    })
  })
})