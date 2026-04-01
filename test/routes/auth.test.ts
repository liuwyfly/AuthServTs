import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

// These tests use dependency injection via fastify.mysql mock.
// They assume the MySQL plugin is replaceable via skipOverride,
// or that a real DB connection is available (integration test).
//
// For unit-level testing without a live DB, mock fastify.mysql on the instance:
//   app.decorate('mysql', { query: async () => [[]] })

test('POST /auth/register - returns 201 on success', async (t) => {
  const app = await build(t)

  // Stub out the mysql decorator so no real DB call is made
  app.decorate('mysql', {
    query: async (sql: string, values: unknown[]) => {
      if ((sql as string).startsWith('SELECT')) return [[]] // no existing user
      return [{ insertId: 1 }]
    }
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { username: 'testuser', password: 'password123' }
  })

  assert.strictEqual(res.statusCode, 201)
  assert.deepStrictEqual(JSON.parse(res.payload), { message: 'User registered successfully' })
})

test('POST /auth/register - returns 409 when username taken', async (t) => {
  const app = await build(t)

  app.decorate('mysql', {
    query: async () => [[{ id: 1, username: 'testuser', password: 'hashed' }]]
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { username: 'testuser', password: 'password123' }
  })

  assert.strictEqual(res.statusCode, 409)
})

test('POST /auth/login - returns 401 for unknown user', async (t) => {
  const app = await build(t)

  app.decorate('mysql', {
    query: async () => [[]] // no user found
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'nobody', password: 'password123' }
  })

  assert.strictEqual(res.statusCode, 401)
})

test('POST /auth/login - returns 400 on missing fields', async (t) => {
  const app = await build(t)

  app.decorate('mysql', {
    query: async () => [[]]
  })

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'u' } // missing password, username too short
  })

  assert.strictEqual(res.statusCode, 400)
})
