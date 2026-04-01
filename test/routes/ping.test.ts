import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('ping route', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/ping'
  })
  assert.deepStrictEqual(JSON.parse(res.payload), { pong: true })
})
