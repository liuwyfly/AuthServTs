import { type FastifyPluginAsync } from 'fastify'

const ping: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/ping', async function (request, reply) {
    return { pong: true }
  })
}

export default ping
