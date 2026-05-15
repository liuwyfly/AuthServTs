import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify'
import { SUPER_ADMIN } from './constants'

export interface AuthorizationRoleBody {
  roles: string
}

export const authorizationRoleBodySchema = {
  type: 'object',
  required: ['roles'],
  properties: {
    roles: { type: 'string' }
  }
}

/*
  Header Authorization 必须
  多个角色用逗号(,)分隔
  参数
  {
    "roles": "content_admin"
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
  this.log.info({ uid: user.uid, roles: request.body.roles }, 'authorization_role: authenticated user')

  const { roles } = request.body
  const requiredRoles = roles.split(',').map(r => r.trim()).filter(r => r.length > 0)

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
    if (ur.key === SUPER_ADMIN) {
      return reply.send({ authorized: true, role: SUPER_ADMIN })
    }

    if (requiredRoles.includes(ur.key)) {
      return reply.send({ authorized: true, role: ur.key })
    }
  }

  return reply.send({ authorized: false, message: 'The user does not have the any roles!' })
}
