import { type FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export async function AuthorizationByRoleHandler (
  this: FastifyInstance,
  request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
  await request.jwtVerify()
  const user = request.user as { uid: number; username: string }

  // log uid
  request.log.info({ uid: user.uid }, 'authorizationByRole: authenticated user')
  
  return reply.send({ message: 'Authorization Success'})
}
