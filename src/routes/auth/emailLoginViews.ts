import { type FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { findUserByUsername, createUser } from '../../models/user'

export interface AuthBody {
  username: string
  password: string
}

export interface RegisterBody extends AuthBody {
  validation_code: string
}

export const loginBodySchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50 },
    password: { type: 'string', minLength: 6 }
  }
}

export const registerBodySchema = {
  type: 'object',
  required: ['username', 'password', 'validation_code'],
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50 },
    password: { type: 'string', minLength: 6 },
    validation_code: { type: 'string' }
  }
}

export async function loginThrottlePreHandler (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const fastify = request.server
  const ip = request.ip
  const key = `login-throttle:${ip}`
  const now = Date.now()
  const windowMs = 10 * 1000 // 10 seconds
  const maxAttempts = 3
  const store = fastify.throttleStore
  let entry = store.get(key)
  if (!entry || now - entry.start > windowMs) {
    entry = { count: 0, start: now }
  }
  entry.count++
  store.set(key, entry)
  if (entry.count > maxAttempts) {
    return reply.code(429).send({ error: 'Too many login attempts, please try again later.' })
  }
}

export async function registerHandler (
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
): Promise<void> {
  const { username, password, validation_code } = request.body

  if (validation_code !== process.env.REGISTER_VALIDATION_CODE) {
    return reply.code(403).send({ error: 'Invalid validation code' })
  }

  const fastify = request.server
  const existing = await findUserByUsername(fastify, username)
  if (existing) {
    return reply.code(409).send({ error: 'Username already taken' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const uid = await createUser(fastify, username, hashedPassword)

  return reply.code(201).send({ message: 'User registered successfully', uid })
}

export async function loginHandler (
    this: FastifyInstance,
    request: FastifyRequest<{ Body: AuthBody }>,
    reply: FastifyReply
): Promise<void> {
    const { username, password } = request.body

    const user = await findUserByUsername(this, username)
    if (!user) {
        return reply.code(401).send({ message: 'Invalid username or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        return reply.code(401).send({ message: 'Invalid username or password' })
    }

    const token = this.jwt.sign(
        { uid: user.uid, username: user.username },
        { expiresIn: '7d' }
    )

    return reply.send({ token, uid: user.uid })
}
