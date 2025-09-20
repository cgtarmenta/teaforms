/**
 * Local authentication module for development
 * Uses simple JWT without Cognito for local testing
 */

import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { db, keys } from './ddb'
import type { AuthUser, UserProfile, UserRole } from './auth'

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production'
const IS_LOCAL = process.env.LOCAL_DEVELOPMENT === 'true'

// Generate JWT token for local development
export function generateLocalToken(user: {
  sub: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
}): string {
  return jwt.sign(
    {
      sub: user.sub,
      email: user.email,
      'custom:role': user.role,
      given_name: user.firstName,
      family_name: user.lastName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    },
    JWT_SECRET
  )
}

// Verify JWT token for local development
export function verifyLocalToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload['custom:role'] as UserRole,
      firstName: payload.given_name,
      lastName: payload.family_name
    }
  } catch (error) {
    console.error('Local token verification failed:', error)
    return null
  }
}

// Local login endpoint for development
export async function localLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }
  
  // For local development, accept any password that matches a pattern
  // In production, this would verify against Cognito
  if (!IS_LOCAL) {
    res.status(403).json({ error: 'Local login only available in development' })
    return
  }
  
  // Simple password check for development
  // Accept: 'dev123' for any user or email as password
  if (password !== 'dev123' && password !== email) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  
  // Find or create user
  let userProfile: UserProfile | null = null
  
  // Try to find existing user by email
  const users = await db.scan<UserProfile>({
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  })
  
  if (users.length > 0) {
    userProfile = users[0]
  } else {
    // Create new user for development
    const userId = `dev-${Date.now()}`
    const role = email.includes('admin') ? 'sysadmin' : 
                 email.includes('clinician') ? 'clinician' : 'teacher'
    
    userProfile = {
      ...keys.user(userId),
      userId,
      role: role as UserRole,
      email,
      firstName: email.split('@')[0],
      lastName: 'Dev',
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as UserProfile
    
    await db.put(userProfile)
  }
  
  // Generate token
  const token = generateLocalToken({
    sub: userProfile.userId,
    email: userProfile.email,
    role: userProfile.role,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName
  })
  
  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
  
  res.json({
    success: true,
    user: {
      userId: userProfile.userId,
      email: userProfile.email,
      role: userProfile.role,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName
    },
    token
  })
}

// Local logout endpoint
export function localLogout(req: Request, res: Response): void {
  res.clearCookie('token')
  res.json({ success: true })
}

// Extract and verify token for local development
export function extractAndVerifyLocalToken(req: Request): AuthUser | null {
  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyLocalToken(token)
  }

  // Check cookie
  const token = req.cookies?.token
  if (token) {
    return verifyLocalToken(token)
  }

  return null
}