import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

function setPrismaUserMock (app: any, overrides: {
  findUnique?: (args?: unknown) => Promise<unknown>
  create?: (args?: unknown) => Promise<unknown>
}) {
  app.prisma = {
    ...app.prisma,
    user: {
      ...app.prisma.user,
      ...overrides
    }
  }
}

// These tests use dependency injection via fastify.prisma mock.
// They assume the Prisma plugin is replaceable via skipOverride,
// or that a real DB connection is available (integration test).
//
// For unit-level testing without a live DB, mock fastify.prisma on the instance:
//   app.decorate('prisma', { user: { findUnique: async () => null, create: async () => ({}) } })

test('POST /auth/register - returns 201 on success', async (t) => {
  const app = await build(t)

  setPrismaUserMock(app, {
    findUnique: async () => null,
    create: async () => ({ id: 1 })
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { username: 'testuser', password: 'password123', validation_code: process.env.REGISTER_VALIDATION_CODE }
  })

  assert.strictEqual(res.statusCode, 201)
  const payload = JSON.parse(res.payload)
  assert.ok(Object.prototype.hasOwnProperty.call(payload, 'message'))
  assert.ok(Object.prototype.hasOwnProperty.call(payload, 'uid'))
})

test('POST /auth/register - returns 409 when username taken', async (t) => {
  const app = await build(t)

  setPrismaUserMock(app, {
    findUnique: async () => ({ id: 1, uid: 'existing_uid', username: 'testuser', password: 'hashed' })
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { username: 'testuser', password: 'password123', validation_code: process.env.REGISTER_VALIDATION_CODE }
  })

  assert.strictEqual(res.statusCode, 409)
})

// 登录，不存在的用户
test('POST /auth/login - returns 401 for unknown user', async (t) => {
  const app = await build(t)

  setPrismaUserMock(app, {
    findUnique: async () => null
  }) // no user found

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'nobody', password: 'password123' }
  })

  assert.strictEqual(res.statusCode, 401)
})

// 只有 username 字段
test('POST /auth/login - returns 400 on missing fields', async (t) => {
  const app = await build(t)

  setPrismaUserMock(app, {
    findUnique: async () => null
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'u' } // missing password, username too short
  })

  assert.strictEqual(res.statusCode, 400)
})
