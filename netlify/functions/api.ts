/**
 * Netlify Functions 入口：用 Node 原生 http 模块包装 Express 应用
 *
 * 不再依赖 serverless-http（v4 在 Node 18+ 下会触发
 *   "Cannot set property body of #<Request> which has only a getter"，
 * 因为它把 Netlify event 转成 fetch Request，而 Request.body 是只读 getter）。
 *
 * 改为直接构造 http.IncomingMessage / http.ServerResponse，调用 Express app，
 * 拦截 res.write / res.end 收集响应体，再转回 Netlify response 格式。
 */
import http from 'node:http'
import { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'
import app from '../../api/app.js'
import { initDb } from '../../api/src/db/index.js'

let dbReady = false
let dbPromise: Promise<void> | null = null

async function ensureDb(): Promise<void> {
  if (dbReady) return
  if (!dbPromise) {
    dbPromise = initDb()
      .then(() => { dbReady = true })
      .catch((err) => {
        console.error('[netlify] 数据库初始化失败:', err instanceof Error ? err.message : err)
        const dbUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
        const token = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN
        console.error(
          '[netlify] 环境变量诊断: TURSO_DATABASE_URL =',
          dbUrl ? `已配置 (${dbUrl})` : '未配置 ❌',
          '| TURSO_AUTH_TOKEN =',
          token ? '已配置 ✓' : '未配置 ❌'
        )
        console.error(
          '[netlify] 排查建议: ① 确认 Netlify 控制台已配置以上两个变量 ② 确认 Turso 数据库地址和令牌有效 ③ 查看 Functions 日志中 [db][init] 开头的详细日志'
        )
        dbPromise = null
        throw err
      })
  }
  await dbPromise
}

// 前缀归一化：Netlify 把 /api/pets 改写成 /.netlify/functions/api/pets 后再传进来，
// 需要还原成 Express 路由能匹配的形式（/api/pets 或 /uploads/xxx）
const FN_PREFIX = '/.netlify/functions/api'

function normalizePath(rawPath: string): string {
  let url = rawPath || '/'
  if (url.startsWith(FN_PREFIX)) {
    url = url.slice(FN_PREFIX.length) || '/'
  }
  // 已带 /api 前缀，或指向 uploads 静态文件，直接放行
  if (url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/')) {
    return url
  }
  // 未带前缀（如 /pets、/health），补上 /api
  return '/api' + (url === '/' ? '' : url)
}

/**
 * 把 Netlify event 转成真实的 http.IncomingMessage
 * 用一个不挂载真实 socket 的 Readable 作为 IncomingMessage 的底层流。
 */
function buildRequest(event: HandlerEvent): http.IncomingMessage {
  const method = event.httpMethod || 'GET'
  const path = normalizePath(event.path || '/')

  // query string
  const qsp = event.queryStringParameters || {}
  const qs = Object.keys(qsp).length > 0
    ? '?' + new URLSearchParams(qsp as Record<string, string>).toString()
    : ''
  const url = path + qs

  // body：Netlify 可能 base64 编码
  const isBase64 = !!event.isBase64Encoded
  const raw = event.body ?? ''
  const bodyBuffer = raw ? Buffer.from(raw, isBase64 ? 'base64' : 'utf8') : Buffer.alloc(0)

  // headers：Netlify 提供小写键名，multiValueHeaders 优先
  const headers: Record<string, string | string[]> = {}
  if (event.multiValueHeaders) {
    for (const [k, vs] of Object.entries(event.multiValueHeaders)) {
      headers[k.toLowerCase()] = vs.length === 1 ? vs[0] : vs
    }
  } else if (event.headers) {
    for (const [k, v] of Object.entries(event.headers)) {
      headers[k.toLowerCase()] = v as string
    }
  }
  if (bodyBuffer.length > 0 && !headers['content-length']) {
    headers['content-length'] = String(bodyBuffer.length)
  }
  if (!headers['host']) {
    headers['host'] = event.headers?.host || 'netlify-function.local'
  }

  // 构造一个空 socket Readable 作为 IncomingMessage 的底层流
  // 关键：IncomingMessage 继承自 Readable，我们直接 push body 数据进去
  const socket = new Readable({ read() {} }) as unknown as import('node:net').Socket
  ;(socket as any).writable = true
  ;(socket as any).remoteAddress = '127.0.0.1'
  ;(socket as any).remotePort = 443
  ;(socket as any).encrypted = true

  const req = new http.IncomingMessage(socket)
  req.method = method
  req.url = url
  req.headers = headers
  req.httpVersion = '1.1'
  req.httpVersionMajor = 1
  req.httpVersionMinor = 1
  if (bodyBuffer.length > 0) {
    req.push(bodyBuffer)
  }
  req.push(null)

  return req
}

/**
 * 构造真实的 http.ServerResponse，并拦截其输出，
 * 收集 Express 写入的状态码、headers、body，再转成 Netlify response。
 */
function buildResponse(
  req: http.IncomingMessage,
  resolve: (r: HandlerResponse) => void
): http.ServerResponse {
  const res = new http.ServerResponse(req)
  const chunks: Buffer[] = []

  const origWrite = res.write.bind(res)
  const origEnd = res.end.bind(res)

  res.write = function (chunk: any, ...rest: any[]): boolean {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk, rest[0] as BufferEncoding) : (Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
    chunks.push(buf)
    return true
  } as any

  res.end = function (chunk?: any, ...rest: any[]): http.ServerResponse {
    if (chunk) {
      const buf = typeof chunk === 'string'
        ? Buffer.from(chunk, rest[0] as BufferEncoding | undefined)
        : (Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      chunks.push(buf)
    }
    const body = Buffer.concat(chunks)

    // 收集响应头（getHeaders 返回小写键名 → 字符串/数组）
    // Netlify HandlerResponse.headers 只接受标量值，多值用逗号拼接（HTTP 标准）
    const rawHeaders = res.getHeaders()
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (v === undefined) continue
      if (Array.isArray(v)) {
        headers[k] = v.join(', ')
      } else {
        headers[k] = String(v)
      }
    }

    // 判断响应体是否需要 base64 编码（Netlify 对二进制内容需要）
    // 简化策略：JSON / 文本类直接 utf8；带二进制 content-type 的才 base64
    const ct = String(headers['content-type'] || '').toLowerCase()
    const isBinary = /image\/|audio\/|video\/|application\/octet-stream|multipart\//.test(ct)
    const isBase64 = isBinary
    const bodyStr = isBase64 ? body.toString('base64') : body.toString('utf8')

    resolve({
      statusCode: res.statusCode || 200,
      headers,
      body: bodyStr,
      isBase64Encoded: isBase64,
    })

    // 返回 this 以满足 ServerResponse.end 的签名（实际不会再被调用）
    return res
  } as any

  return res
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  // 冷启动时初始化数据库；失败时返回标准 JSON 而不是让 Netlify 输出 HTML 错误页
  try {
    await ensureDb()
  } catch (err) {
    console.error('[netlify] DB init failed:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 500, message: '数据库初始化失败，请检查 Turso 环境变量配置', data: null }),
    }
  }

  return new Promise<HandlerResponse>((resolve) => {
    const req = buildRequest(event)
    const res = buildResponse(req, resolve)

    // 直接调用 Express app（app 本身就是一个 (req, res) => void 的请求监听器）
    try {
      app(req as any, res as any)
    } catch (err) {
      console.error('[netlify] Express handler threw:', err)
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 500, message: '服务器内部错误', data: null }),
      })
    }
  })
}

export default handler
