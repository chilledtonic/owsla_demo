import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16
const SALT_LENGTH = 32

function getKey(salt: Buffer): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-for-development'
  return crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512')
}

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey(salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const result = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex')])
  return result.toString('base64')
}

export function decrypt(encryptedData: string): string {
  try {
    const data = Buffer.from(encryptedData, 'base64')
    
    const salt = data.subarray(0, SALT_LENGTH)
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH)
    
    const key = getKey(salt)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
} 