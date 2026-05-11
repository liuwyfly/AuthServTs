/*
 * users 管理
 * 用户，角色，和关联关系
 */

import { type FastifyPluginAsync } from 'fastify'
import {
  roleBodySchema,
  roleIdParamSchema,
  listRolesHandler,
  getRoleHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler
} from './rolesViews'

const users: FastifyPluginAsync = async (fastify): Promise<void> => {
  // ==================== Role Routes ====================

  // 角色列表
  fastify.get('/roles', listRolesHandler)

  fastify.get('/roles/:id', {
    schema: { params: roleIdParamSchema }
  }, getRoleHandler)

  // 创建角色
  fastify.post('/roles', {
    schema: { body: roleBodySchema }
  }, createRoleHandler)

  fastify.put('/roles/:id', {
    schema: {
      params: roleIdParamSchema,
      body: roleBodySchema
    }
  }, updateRoleHandler)

  fastify.delete('/roles/:id', {
    schema: { params: roleIdParamSchema }
  }, deleteRoleHandler)
}

export default users
