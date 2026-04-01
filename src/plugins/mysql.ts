import fp from 'fastify-plugin'
import mysql from '@fastify/mysql'
import type { Pool as PromisePool } from 'mysql2/promise'

export type MySQLPromisePool = Pick<PromisePool, 'query' | 'execute' | 'getConnection'> & {
  pool: PromisePool
}

export default fp(async (fastify) => {
  fastify.register(mysql, {
    promise: true,
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'authserv'
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLPromisePool
  }
}
