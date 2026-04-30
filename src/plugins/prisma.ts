import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function buildDatasourceUrl (): string {
  if (process.env.DATABASE_URL != null && process.env.DATABASE_URL !== '') {
    return process.env.DATABASE_URL
  }

  const host = process.env.MYSQL_HOST ?? 'localhost'
  const port = process.env.MYSQL_PORT ?? '3306'
  const user = encodeURIComponent(process.env.MYSQL_USER ?? 'root')
  const password = encodeURIComponent(process.env.MYSQL_PASSWORD ?? '')
  const database = process.env.MYSQL_DATABASE ?? 'authserv'

  return `mysql://${user}:${password}@${host}:${port}/${database}`
}

export default fp(async (fastify) => {
  const adapter = new PrismaMariaDb(buildDatasourceUrl())
  const prisma = new PrismaClient({
    adapter
  })

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
