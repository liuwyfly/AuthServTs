import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify'

export interface RoleBody {
  name: string
  key: string
}

export interface RoleParams {
  id: string
}

export const roleBodySchema = {
  type: 'object',
  required: ['name', 'key'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 64 },
    key: { type: 'string', minLength: 1, maxLength: 64 }
  }
}

export const roleIdParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: '^[0-9]+$' }
  }
}

// GET /users/roles
export async function listRolesHandler (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const roles = await request.server.prisma.role.findMany({
    orderBy: { id: 'asc' }
  })
  return reply.send({ data: roles })
}

// GET /users/roles/:id
export async function getRoleHandler (
  request: FastifyRequest<{ Params: RoleParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = parseInt(request.params.id, 10)
  const role = await request.server.prisma.role.findUnique({
    where: { id }
  })

  if (!role) {
    return reply.code(404).send({ error: 'Role not found' })
  }

  return reply.send({ data: role })
}

// POST /users/roles
export async function createRoleHandler (
  this: FastifyInstance,
  request: FastifyRequest<{ Body: RoleBody }>,
  reply: FastifyReply
): Promise<void> {
  const { name, key } = request.body

  const existingRole = await this.prisma.role.findFirst({
    where: {
      OR: [{ name }, { key }]
    }
  })

  if (existingRole != null) {
    return reply.code(409).send({ error: 'Role name or key already exists' })
  }

  const role = await this.prisma.role.create({
    data: { name, key }
  })

  return reply.code(201).send({ data: role })
}

// PUT /users/roles/:id
export async function updateRoleHandler (
  this: FastifyInstance,
  request: FastifyRequest<{ Params: RoleParams; Body: RoleBody }>,
  reply: FastifyReply
): Promise<void> {
  const id = parseInt(request.params.id, 10)
  const { name, key } = request.body

  const existing = await request.server.prisma.role.findUnique({
    where: { id }
  })

  if (!existing) {
    return reply.code(404).send({ error: 'Role not found' })
  }

  const role = await request.server.prisma.role.update({
    where: { id },
    data: { name, key }
  })

  return reply.send({ data: role })
}

// DELETE /users/roles/:id
export async function deleteRoleHandler (
  request: FastifyRequest<{ Params: RoleParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = parseInt(request.params.id, 10)

  const existing = await request.server.prisma.role.findUnique({
    where: { id }
  })

  if (!existing) {
    return reply.code(404).send({ error: 'Role not found' })
  }

  await request.server.prisma.role.delete({
    where: { id }
  })

  return reply.code(204).send()
}
