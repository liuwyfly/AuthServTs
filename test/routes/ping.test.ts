import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import app from '../../src/app'
import { build } from '../helper'

test('ping route', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/ping'
  })
  assert.deepStrictEqual(JSON.parse(res.payload), { pong: true })
})

test('ping route supports configured global prefix', async (t) => {
  const server = Fastify()
  await server.register(app, { routePrefix: '/auth-serv' })

  t.after(() => void server.close())

  const res = await server.inject({
    url: '/auth-serv/ping'
  })

  assert.strictEqual(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), { pong: true })

  const unprefixedRes = await server.inject({
    url: '/ping'
  })

  assert.strictEqual(unprefixedRes.statusCode, 404)
})
