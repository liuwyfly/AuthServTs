import { type FastifyInstance, FastifyRequest, type FastifyReply } from 'fastify'

export interface WxCodeBody {
  code: string
}

export const wxCodeBodySchema = {
  type: 'object',
  required: ['code'],
  properties: {
    code: { type: 'string', minLength: 1 }
  }
}

// 微信 jscode2session / oauth2 access_token 接口的返回结构
interface WxAccessTokenResponse {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  openid?: string
  scope?: string
  errcode?: number
  errmsg?: string
}

export async function wechatCodeHandler (
    this: FastifyInstance,
  request: FastifyRequest<{ Body: WxCodeBody }>,
  reply: FastifyReply
): Promise<void> {
  const { code } = request.body

  const appid = process.env.WECHAT_APP_ID
  const secret = process.env.WECHAT_APP_SECRET
  if (!appid || !secret) {
    return reply.code(500).send({ error: 'WeChat appid/secret not configured' })
  }

  // 用前端拿到的 code 向微信服务器换取 access_token
  const url = 'https://api.weixin.qq.com/sns/oauth2/access_token' +
    `?appid=${encodeURIComponent(appid)}` +
    `&secret=${encodeURIComponent(secret)}` +
    `&code=${encodeURIComponent(code)}` +
    '&grant_type=authorization_code'

  let data: WxAccessTokenResponse
  try {
    const res = await fetch(url)
    data = await res.json() as WxAccessTokenResponse
    this.log.info({ code, data }, 'wechat oauth2 debug info')
  } catch (err) {
    request.log.error(err, 'wechat access_token request failed')
    return reply.code(502).send({ error: 'Failed to request WeChat access_token' })
  }

  if (data.errcode || !data.access_token) {
    return reply.code(401).send({ error: data.errmsg ?? 'Invalid wechat code', errcode: data.errcode })
  }

  return reply.send({
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    openid: data.openid,
    scope: data.scope
  })
}
