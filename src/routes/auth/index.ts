import { type FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { findUserByUsername, createUser } from '../../models/user'


// 这是 TypeScript 的**声明合并（Declaration Merging）**机制。

// fastify 包里已经定义了 FastifyInstance 接口。在 declare module 'fastify' 块内再写一个同名的 interface FastifyInstance，
// TypeScript 会将两者合并为一个接口，也就是在原有属性的基础上追加 throttleStore，而不是覆盖它。

// interface 天生支持合并
// 这个模式在 Fastify 插件开发中非常常见，官方插件（如 @fastify/jwt）正是用这种方式将 fastify.jwt 等属性注入到 FastifyInstance 类型中的。

// ==================================================

// throttleStore 本质上只是一个模块级变量

// 因为 fastify 是插件的作用域容器，在整个应用生命周期内存活。
// 将 throttleStore 挂到它上面，只是借用它作为一个长期存活的对象来持有 Map，
// 避免在每次请求时重新创建。

// Fastify 有**插件封装（encapsulation）**机制：
// 用 fastify.register() 注册的插件默认在子作用域中，父级无法访问子级挂载的属性。
// 用 fastify-plugin 包装的插件会跳出封装，将属性暴露到父作用域，这才接近"全局"。

declare module 'fastify' {
  interface FastifyInstance {
    throttleStore: Map<string, { count: number; start: number }>
  }
}

interface AuthBody {
  username: string
  password: string
}

interface RegisterBody extends AuthBody {
  validation_code: string
}

const loginBodySchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50 },
    password: { type: 'string', minLength: 6 }
  }
}

const registerBodySchema = {
  type: 'object',
  required: ['username', 'password', 'validation_code'],
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50 },
    password: { type: 'string', minLength: 6 },
    validation_code: { type: 'string' }
  }
}

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.throttleStore = new Map()

  // POST /auth/register
  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: { body: registerBodySchema }
  }, async (request, reply) => {
    const { username, password, validation_code } = request.body

    if (validation_code !== process.env.REGISTER_VALIDATION_CODE) {
      return reply.code(403).send({ error: 'Invalid validation code' })
    }


    const existing = await findUserByUsername(fastify, username)
    if (existing) {
      return reply.code(409).send({ error: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const uid = await createUser(fastify, username, hashedPassword)

    return reply.code(201).send({ message: 'User registered successfully', uid })
  })

  // 通过用户名，密码登录，成功后返回 JWT token 和用户 ID
  // POST /auth/login
  fastify.post<{ Body: AuthBody }>('/login', {
    schema: { body: loginBodySchema },
    preHandler: [
      async (request, reply) => {
        // Simple in-memory throttle by IP, production should use Redis or similar
        const ip = request.ip
        const key = `login-throttle:${ip}`
        const now = Date.now()
        const windowMs = 60 * 1000 // 1 minute
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
    ]
  }, async (request, reply) => {
    const { username, password } = request.body

    const user = await findUserByUsername(fastify, username)
    if (!user) {
      return reply.code(401).send({ error: 'Invalid username or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid username or password' })
    }

    const token = fastify.jwt.sign(
      { uid: user.uid, username: user.username },
      { expiresIn: '7d' }
    )

    return reply.send({ token, uid: user.uid })
  })

  // GET /auth/test_login
  fastify.get('/test_login', {
    preHandler: [async (request, reply) => { await request.jwtVerify() }]
  }, async (request, reply) => {
    const user = request.user as { uid: number; username: string }
    request.log.info({ uid: user.uid }, 'test_login: authenticated user')
    return reply.send({ message: 'Token is valid', user })
  })
}

export default auth
