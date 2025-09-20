import dynamoose from './config'
import { Document } from 'dynamoose/dist/Document'

// User interface
export interface IUser extends Document {
  PK: string
  SK: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: 'sysadmin' | 'admin' | 'teacher' | 'viewer'
  phone?: string
  locale?: string
  timezone?: string
  active: boolean
  passwordHash?: string // For local development
  lastLogin?: string
  createdAt: string
  updatedAt: string
  GSI1PK?: string // For querying users by role
  GSI1SK?: string // For sorting
}

// User Schema
const UserSchema = new dynamoose.Schema({
  PK: {
    type: String,
    hashKey: true,
    default: (user: IUser) => `USER#${user.userId}`
  },
  SK: {
    type: String,
    rangeKey: true,
    default: 'PROFILE'
  },
  userId: {
    type: String,
    required: true,
    index: {
      name: 'UserIdIndex',
      type: 'global'
    }
  },
  email: {
    type: String,
    required: true,
    index: {
      name: 'EmailIndex',
      type: 'global'
    }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['sysadmin', 'admin', 'teacher', 'viewer'],
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  locale: {
    type: String,
    default: 'es-ES'
  },
  timezone: {
    type: String,
    default: 'Europe/Madrid'
  },
  active: {
    type: Boolean,
    default: true
  },
  passwordHash: {
    type: String,
    required: false
  },
  lastLogin: {
    type: String,
    required: false
  },
  GSI1PK: {
    type: String,
    index: {
      name: 'GSI1',
      type: 'global',
      rangeKey: 'GSI1SK'
    },
    default: (user: IUser) => `ROLE#${user.role}`
  },
  GSI1SK: {
    type: String,
    default: (user: IUser) => `USER#${user.userId}`
  }
}, {
  timestamps: true
})

// Create and export the User model
const User = dynamoose.model<IUser>('User', UserSchema, {
  tableName: process.env.DDB_TABLE || 'app_core'
})

// Helper methods
export class UserService {
  // Find user by email
  static async findByEmail(email: string): Promise<IUser | null> {
    try {
      const results = await User.query('email').eq(email).using('EmailIndex').exec()
      return results[0] || null
    } catch (error) {
      console.error('Error finding user by email:', error)
      return null
    }
  }

  // Find user by ID
  static async findById(userId: string): Promise<IUser | null> {
    try {
      const user = await User.get({
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      })
      return user
    } catch (error) {
      console.error('Error finding user by ID:', error)
      return null
    }
  }

  // Find users by role
  static async findByRole(role: string): Promise<IUser[]> {
    try {
      const results = await User.query('GSI1PK')
        .eq(`ROLE#${role}`)
        .using('GSI1')
        .exec()
      return results
    } catch (error) {
      console.error('Error finding users by role:', error)
      return []
    }
  }

  // Create new user
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const userId = userData.userId || `user-${Date.now()}`
    const user = new User({
      ...userData,
      userId,
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    })
    
    return await user.save()
  }

  // Update user
  static async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    try {
      const user = await User.update(
        {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        },
        updates
      )
      return user
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  // Delete user (soft delete)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await User.update(
        {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        },
        {
          active: false,
          updatedAt: new Date().toISOString()
        }
      )
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  // Get all active users
  static async getAllActiveUsers(): Promise<IUser[]> {
    try {
      const results = await User.scan()
        .where('SK').eq('PROFILE')
        .where('active').eq(true)
        .exec()
      return results
    } catch (error) {
      console.error('Error getting active users:', error)
      return []
    }
  }
}

export default User