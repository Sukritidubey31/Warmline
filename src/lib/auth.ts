import bcrypt from 'bcryptjs'
import { createToken, verifyToken } from './jwt'

export { createToken, verifyToken }

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateGuestCredentials(): { username: string, password: string } {
  const adjectives = ['swift', 'bright', 'calm', 'bold', 'warm', 'keen', 'wise', 'cool', 'brave', 'kind']
  const nouns = ['panda', 'falcon', 'river', 'cedar', 'comet', 'prism', 'atlas', 'ember', 'maple', 'stone']
  const num = Math.floor(Math.random() * 9000) + 1000
  const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${num}`
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const password = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return { username, password }
}
