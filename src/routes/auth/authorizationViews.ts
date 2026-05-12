import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify'

export interface AuthorizationRoleBody {
  role: string
}

export const authorizationRoleBodySchema = {
  type: 'object',
  required: ['role'],
  properties: {
    role: { type: 'string' }
  }
}

/*
  Header Authorization 必须
  参数
  {
    "role": "content_admin"
  }
    
  返回
  {
    "authorized": true,
    "role": "content_admin"
  }
  或者
  {
    "authorized": false,
    "error": "Forbidden: required role not found"
  }
 */
export async function AuthorizationByRoleHandler (
  this: FastifyInstance,
  request: FastifyRequest<{ Body: AuthorizationRoleBody }>,
  reply: FastifyReply
): Promise<void> {
  await request.jwtVerify()
  const user = request.user as { uid: string; username: string }

  // log uid
  this.log.info({ uid: user.uid, role: request.body.role }, 'authorization_role: authenticated user')

  const { role } = request.body
  const requiredRoles = role.split(',').map(r => r.trim()).filter(r => r.length > 0)

  if (requiredRoles.length === 0) {
    return reply.code(400).send({ error: 'Invalid role parameter' })
  }

  /*
  标签模板字符串（tagged template literals）
  如果写成普通的函数调用，需要手动构造 Prisma.sql：
  prisma.$queryRaw(Prisma.sql`SELECT ... WHERE uid = ${user.uid}`)
  */
  const userRoles = await this.prisma.$queryRaw<{ role_id: number; key: string }[]>`
    select ur.role_id, r.key
    from user_role ur
    join role r on r.id = ur.role_id
    where ur.uid = ${user.uid}
  `

  for (const ur of userRoles) {
    if (ur.key === 'super_admin') {
      return reply.send({ authorized: true, role: 'super_admin' })
    }

    if (requiredRoles.includes(ur.key)) {
      return reply.send({ authorized: true, role: ur.key })
    }
  }

  return reply.code(403).send({ authorized: false, error: 'Forbidden: required role not found' })
}
