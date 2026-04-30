import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'

export interface UserRow {
  id: number
  uid: string
  username: string
  password: string
}

export async function findUserByUsername (
  fastify: FastifyInstance,
  username: string
): Promise<UserRow | null> {
  const user = await fastify.prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      uid: true,
      username: true,
      password: true
    }
  })

  return user
}

export async function createUser (
  fastify: FastifyInstance,
  username: string,
  hashedPassword: string
): Promise<string> {
  const uid = randomUUID().replace(/-/g, '')
  await fastify.prisma.user.create({
    data: {
      uid,
      username,
      password: hashedPassword
    }
  })

  return uid
}
