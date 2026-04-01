import { RowDataPacket } from 'mysql2'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'

export interface UserRow extends RowDataPacket {
  id: number
  uid: string
  username: string
  password: string
}

export async function findUserByUsername (
  fastify: FastifyInstance,
  username: string
): Promise<UserRow | null> {
  const [rows] = await fastify.mysql.query<UserRow[]>(
    'SELECT id, uid, username, password FROM users WHERE username = ?',
    [username]
  )
  return rows[0] ?? null
}

export async function createUser (
  fastify: FastifyInstance,
  username: string,
  hashedPassword: string
): Promise<string> {
  const uid = randomUUID().replace(/-/g, '')
  await fastify.mysql.query(
    'INSERT INTO users (uid, username, password) VALUES (?, ?, ?)',
    [uid, username, hashedPassword]
  )
  return uid
}
