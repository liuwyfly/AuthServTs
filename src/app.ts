import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {
  routePrefix?: string
}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

function normalizeRoutePrefix (routePrefix?: string): string {
  if (routePrefix == null) {
    return ''
  }

  const trimmed = routePrefix.trim()
  if (trimmed === '' || trimmed === '/') {
    return ''
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function resolveRoutePrefix (optsPrefix?: string): string {
  const normalizedFromOpts = normalizeRoutePrefix(optsPrefix)
  if (normalizedFromOpts !== '') {
    return normalizedFromOpts
  }

  return normalizeRoutePrefix(process.env.FASTIFY_ROUTE_PREFIX)
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void

  /* 路由前缀说明 */
  /* 
  1. Fastify 的封装/作用域机制：Fastify 使用基于插件的架构，每个 register 调用都会创建一个新的作用域
  2. 前缀(prefix)的作用范围：prefix 选项只会应用到该插件内部定义的所有路由
  3. AutoLoad 的行为：AutoLoad 插件会动态加载目录下的所有路由文件

  代码中的写法：
  创建一个父插件 routesScope，它有一个 prefix 选项
  在 routesScope 内部注册 AutoLoad，加载所有路由
  由于 AutoLoad 是在 routesScope 的作用域内注册的，所有加载的路由都会继承 routesScope 的前缀
  AutoLoad 只是一个加载器，它会把 options 传给每个加载的插件，但不会处理 prefix
   */
  const routePrefix = resolveRoutePrefix(opts.routePrefix)

  void fastify.register(async function routesScope (routesFastify) {
    void routesFastify.register(AutoLoad, {
      dir: join(__dirname, 'routes'),
      options: opts
    })
  }, {
    prefix: routePrefix
  })
}

export default app
export { app, options }
