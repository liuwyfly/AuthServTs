import { type FastifyPluginAsync } from 'fastify'


const mathLearning: FastifyPluginAsync = async (fastify): Promise<void> => {
    // ping
    fastify.get('/ping', async function (request, reply) {
        return { pong: true, message: "auth" }
    })
    
}

export default mathLearning
