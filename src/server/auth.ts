import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { Request, Response, NextFunction } from 'express'
import { db, keys } from './ddb.js'

// Types
export type UserRole = 'sysadmin' | 'clinician' | 'teacher'

export interface AuthUser {
  sub: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  cognitoGroups?: string[]
}

export interface UserProfile {
  PK: string
  SK: string
  userId: string
  role: UserRole
  email: string
  firstName: string
  lastName: string
  phone?: string
  specialty?: string
  hospital?: string
  gradeOrSubject?: string
  school?: string
  locale: string
  timezone: string
  createdAt: string
  updatedAt: string
  active: boolean
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      userProfile?: UserProfile
    }
  }
}

// Initialize Cognito JWT Verifier
const userPoolId = process.env.COGNITO_USER_POOL_ID || ''
const clientId = process.env.COGNITO_CLIENT_ID || ''
const region = process.env.AWS_REGION || 'eu-west-2'

let jwtVerifier: CognitoJwtVerifier<{
  userPoolId: string
  clientId: string
  tokenUse: 'id'
}> | null = null

if (userPoolId && clientId) {
  jwtVerifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id'
  })
}

// Extract token from request
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const token = req.cookies?.idToken || req.cookies?.token
  if (token) {
    return token
  }

  return null
}

// Verify JWT token
export async function verifyToken(token: string): Promise<AuthUser | null> {
  if (!jwtVerifier) {
    console.error('JWT verifier not initialized. Check Cognito configuration.')
    return null
  }

  try {
    const payload = await jwtVerifier.verify(token)
    
    // Extract custom claims
    const role = (payload['custom:role'] || 'teacher') as UserRole
    const firstName = payload['given_name'] as string | undefined
    const lastName = payload['family_name'] as string | undefined
    const email = payload['email'] as string
    const sub = payload['sub'] as string
    const groups = payload['cognito:groups'] as string[] | undefined

    return {
      sub,
      email,
      role,
      firstName,
      lastName,
      cognitoGroups: groups
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Load user profile from DynamoDB
export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profile = await db.get<UserProfile>(keys.user(userId))
    
    if (!profile || !profile.active) {
      return null
    }

    return profile
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

// Authentication middleware
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (!token) {
    res.status(401).json({ error: 'No authentication token provided' })
    return
  }

  const user = await verifyToken(token)
  
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Load user profile from database
  const profile = await loadUserProfile(user.sub)
  
  if (!profile) {
    res.status(403).json({ error: 'User profile not found or inactive' })
    return
  }

  // Attach to request
  req.user = {
    ...user,
    role: profile.role // Use role from database as source of truth
  }
  req.userProfile = profile

  next()
}

// Role-based authorization middleware
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      })
      return
    }

    next()
  }
}

// Check if user can access specific resource
export function canAccess(
  user: AuthUser,
  resource: {
    type: 'episode' | 'form' | 'user'
    ownerId?: string
    formId?: string
  }
): boolean {
  // Sysadmin can access everything
  if (user.role === 'sysadmin') {
    return true
  }

  // Clinician can access all episodes and forms
  if (user.role === 'clinician') {
    return resource.type !== 'user'
  }

  // Teacher can only access their own episodes
  if (user.role === 'teacher') {
    if (resource.type === 'episode' && resource.ownerId === user.sub) {
      return true
    }
    if (resource.type === 'form') {
      return true // Teachers can view forms to submit episodes
    }
  }

  return false
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (token) {
    const user = await verifyToken(token)
    if (user) {
      const profile = await loadUserProfile(user.sub)
      if (profile) {
        req.user = {
          ...user,
          role: profile.role
        }
        req.userProfile = profile
      }
    }
  }

  next()
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  actorId: string,
  details: Record<string, any>
): Promise<void> {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const timestamp = now.toISOString()

  await db.put({
    ...keys.audit(date, timestamp, action, actorId),
    action,
    actorId,
    timestamp,
    details,
    ipAddress: details.ipAddress || null,
    userAgent: details.userAgent || null
  })
}