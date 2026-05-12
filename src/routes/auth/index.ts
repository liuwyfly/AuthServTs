import { type FastifyPluginAsync } from 'fastify'
import {
  loginBodySchema,
  registerBodySchema,
  loginThrottlePreHandler,
  registerHandler,
  loginHandler,
  type RegisterBody,
  type AuthBody
} from './emailLoginViews'
import { AuthorizationByRoleHandler, authorizationRoleBodySchema, type AuthorizationRoleBody } from './authorizationViews'

// 这是 TypeScript 的**声明合并（Declaration Merging）**机制。

// fastify 包里已经定义了 FastifyInstance 接口。在 declare module 'fastify' 块内再写一个同名的 interface FastifyInstance，
// TypeScript 会将两者合并为一个接口，也就是在原有属性的基础上追加 throttleStore，而不是覆盖它。

// interface 天生支持合并
// 这个模式在 Fastify 插件开发中非常常见，官方插件（如 @fastify/jwt）正是用这种方式将 fastify.jwt 等属性注入到 FastifyInstance 类型中的。

// ==================================================

// throttleStore 本质上只是一个模块级变量

// 因为 fastify 是插件的作用域容器，在整个应用生命周期内存活。
// 将 throttleStore 挂到它上面，只是借用它作为一个长期存活的对象来持有 Map，
// 避免在每次请求时重新创建。

// Fastify 有**插件封装（encapsulation）**机制：
// 用 fastify.register() 注册的插件默认在子作用域中，父级无法访问子级挂载的属性。
// 用 fastify-plugin 包装的插件会跳出封装，将属性暴露到父作用域，这才接近"全局"。

declare module 'fastify' {
  interface FastifyInstance {
    throttleStore: Map<string, { count: number; start: number }>
  }
}

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.throttleStore = new Map()

  // POST /auth/register
  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: { body: registerBodySchema }
  }, registerHandler)

  // 通过用户名，密码登录，成功后返回 JWT token 和 uid
  // POST /auth/login
  fastify.post<{ Body: AuthBody }>('/login', {
    schema: { body: loginBodySchema },
    preHandler: [loginThrottlePreHandler]
  }, loginHandler)

  // 通过 Header Authorization jwt token 取得 uid
  // 判断用户是否具有某个角色
  // POST /auth/authorization_role
  fastify.post<{ Body: AuthorizationRoleBody }>('/authorization_role', {
    schema: { body: authorizationRoleBodySchema }
  }, AuthorizationByRoleHandler)
}

export default auth
