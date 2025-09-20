import type { Express } from 'express'
import { authenticate, authorize, createAuditLog, type UserRole, type UserProfile } from '../../auth.js'
import { db, keys } from '../../ddb.js'
import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminResetUserPasswordCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'
import { v4 as uuidv4 } from 'uuid'

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-2'
})

const userPoolId = process.env.COGNITO_USER_POOL_ID || ''

export function setupUserRoutes(app: Express) {
  // List users (sysadmin only)
  app.get('/api/users', authenticate, authorize('sysadmin'), async (req, res) => {
    try {
      const { role, active } = req.query

      // Query all users
      const users = await db.query<UserProfile>({
        KeyConditionExpression: 'begins_with(PK, :pk) AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'USER#',
          ':sk': 'PROFILE'
        }
      })

      // Apply filters
      let filteredUsers = users
      
      if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role)
      }
      
      if (active !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.active === (active === 'true'))
      }

      // Remove sensitive data
      const sanitizedUsers = filteredUsers.map(user => ({
        userId: user.userId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        active: user.active,
        createdAt: user.createdAt,
        school: user.school,
        hospital: user.hospital
      }))

      res.json(sanitizedUsers)
    } catch (error) {
      console.error('Failed to list users:', error)
      res.status(500).json({ error: 'Failed to list users' })
    }
  })

  // Get user profile
  app.get('/api/users/:userId', authenticate, async (req, res) => {
    try {
      const { userId } = req.params

      // Users can only view their own profile unless admin
      if (req.user!.sub !== userId && req.user!.role !== 'sysadmin') {
        return res.status(403).json({ error: 'Access denied' })
      }

      const profile = await db.get<UserProfile>(keys.user(userId))
      
      if (!profile) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Remove sensitive data for non-admins
      if (req.user!.role !== 'sysadmin') {
        delete (profile as any).PK
        delete (profile as any).SK
      }

      res.json(profile)
    } catch (error) {
      console.error('Failed to get user:', error)
      res.status(500).json({ error: 'Failed to get user' })
    }
  })

  // Create user (sysadmin only)
  app.post('/api/users', authenticate, authorize('sysadmin'), async (req, res) => {
    try {
      const {
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        specialty,
        hospital,
        gradeOrSubject,
        school,
        sendEmail = true
      } = req.body

      // Validation
      if (!email || !role || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['email', 'role', 'firstName', 'lastName']
        })
      }

      if (!['sysadmin', 'clinician', 'teacher'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }

      // Create user in Cognito
      const cognitoUserId = uuidv4()
      
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          { Name: 'custom:role', Value: role },
          { Name: 'sub', Value: cognitoUserId }
        ],
        MessageAction: sendEmail ? MessageActionType.RESEND : MessageActionType.SUPPRESS,
        TemporaryPassword: password || undefined
      })

      await cognitoClient.send(createUserCommand)

      // If password provided, set it as permanent
      if (password) {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: email,
          Password: password,
          Permanent: true
        })
        await cognitoClient.send(setPasswordCommand)
      }

      // Create user profile in DynamoDB
      const now = new Date().toISOString()
      const userProfile: UserProfile = {
        ...keys.user(cognitoUserId),
        userId: cognitoUserId,
        role: role as UserRole,
        email,
        firstName,
        lastName,
        phone: phone || null,
        specialty: specialty || null,
        hospital: hospital || null,
        gradeOrSubject: gradeOrSubject || null,
        school: school || null,
        locale: 'es-ES',
        timezone: 'Europe/Madrid',
        createdAt: now,
        updatedAt: now,
        active: true
      }

      await db.put(userProfile)

      // Audit log
      await createAuditLog('USER_CREATED', req.user!.sub, {
        newUserId: cognitoUserId,
        email,
        role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.status(201).json({
        userId: cognitoUserId,
        email,
        role,
        temporaryPassword: !password && sendEmail
      })
    } catch (error) {
      console.error('Failed to create user:', error)
      res.status(500).json({ error: 'Failed to create user' })
    }
  })

  // Update user profile
  app.put('/api/users/:userId', authenticate, async (req, res) => {
    try {
      const { userId } = req.params
      const updates = req.body

      // Users can only update their own profile unless admin
      if (req.user!.sub !== userId && req.user!.role !== 'sysadmin') {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Check if user exists
      const existingProfile = await db.get<UserProfile>(keys.user(userId))
      
      if (!existingProfile) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Prevent non-admins from changing role or active status
      if (req.user!.role !== 'sysadmin') {
        delete updates.role
        delete updates.active
        delete updates.userId
      }

      // Remove protected fields
      delete updates.PK
      delete updates.SK
      delete updates.createdAt

      // Update in DynamoDB
      if (Object.keys(updates).length > 0) {
        await db.update(keys.user(userId), updates)

        // Update Cognito attributes if needed
        const cognitoUpdates = []
        if (updates.firstName) {
          cognitoUpdates.push({ Name: 'given_name', Value: updates.firstName })
        }
        if (updates.lastName) {
          cognitoUpdates.push({ Name: 'family_name', Value: updates.lastName })
        }
        if (updates.role && req.user!.role === 'sysadmin') {
          cognitoUpdates.push({ Name: 'custom:role', Value: updates.role })
        }

        if (cognitoUpdates.length > 0) {
          const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: existingProfile.email,
            UserAttributes: cognitoUpdates
          })
          await cognitoClient.send(updateCommand)
        }
      }

      // Audit log
      await createAuditLog('USER_UPDATED', req.user!.sub, {
        updatedUserId: userId,
        updates,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, userId })
    } catch (error) {
      console.error('Failed to update user:', error)
      res.status(500).json({ error: 'Failed to update user' })
    }
  })

  // Disable/Enable user (sysadmin only)
  app.put('/api/users/:userId/status', authenticate, authorize('sysadmin'), async (req, res) => {
    try {
      const { userId } = req.params
      const { active } = req.body

      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Active must be a boolean' })
      }

      // Prevent disabling self
      if (userId === req.user!.sub && !active) {
        return res.status(400).json({ error: 'Cannot disable your own account' })
      }

      // Get user profile
      const profile = await db.get<UserProfile>(keys.user(userId))
      
      if (!profile) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Update DynamoDB
      await db.update(keys.user(userId), { active })

      // Update Cognito
      const command = active 
        ? new AdminEnableUserCommand({
            UserPoolId: userPoolId,
            Username: profile.email
          })
        : new AdminDisableUserCommand({
            UserPoolId: userPoolId,
            Username: profile.email
          })

      await cognitoClient.send(command)

      // Audit log
      await createAuditLog(active ? 'USER_ENABLED' : 'USER_DISABLED', req.user!.sub, {
        targetUserId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ success: true, userId, active })
    } catch (error) {
      console.error('Failed to update user status:', error)
      res.status(500).json({ error: 'Failed to update user status' })
    }
  })

  // Reset user password (sysadmin only)
  app.post('/api/users/:userId/reset-password', authenticate, authorize('sysadmin'), async (req, res) => {
    try {
      const { userId } = req.params
      const { temporaryPassword } = req.body

      // Get user profile
      const profile = await db.get<UserProfile>(keys.user(userId))
      
      if (!profile) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (temporaryPassword) {
        // Set specific temporary password
        const command = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: profile.email,
          Password: temporaryPassword,
          Permanent: false
        })
        await cognitoClient.send(command)
      } else {
        // Send reset email
        const command = new AdminResetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: profile.email
        })
        await cognitoClient.send(command)
      }

      // Audit log
      await createAuditLog('PASSWORD_RESET', req.user!.sub, {
        targetUserId: userId,
        method: temporaryPassword ? 'manual' : 'email',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      res.json({ 
        success: true, 
        userId,
        method: temporaryPassword ? 'manual' : 'email'
      })
    } catch (error) {
      console.error('Failed to reset password:', error)
      res.status(500).json({ error: 'Failed to reset password' })
    }
  })

  // Get current user profile
  app.get('/api/users/me', authenticate, async (req, res) => {
    try {
      const profile = await db.get<UserProfile>(keys.user(req.user!.sub))
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

      res.json(profile)
    } catch (error) {
      console.error('Failed to get current user:', error)
      res.status(500).json({ error: 'Failed to get user profile' })
    }
  })

  // Update current user profile
  app.put('/api/users/me', authenticate, async (req, res) => {
    try {
      const updates = req.body

      // Remove protected fields
      delete updates.PK
      delete updates.SK
      delete updates.userId
      delete updates.role
      delete updates.active
      delete updates.createdAt
      delete updates.email // Email changes need special handling

      // Update profile
      if (Object.keys(updates).length > 0) {
        await db.update(keys.user(req.user!.sub), updates)

        // Update Cognito attributes
        const cognitoUpdates = []
        if (updates.firstName) {
          cognitoUpdates.push({ Name: 'given_name', Value: updates.firstName })
        }
        if (updates.lastName) {
          cognitoUpdates.push({ Name: 'family_name', Value: updates.lastName })
        }

        if (cognitoUpdates.length > 0) {
          const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: req.user!.email,
            UserAttributes: cognitoUpdates
          })
          await cognitoClient.send(updateCommand)
        }
      }

      res.json({ success: true })
    } catch (error) {
      console.error('Failed to update profile:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  })
}