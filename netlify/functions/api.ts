// Netlify Functions 入口：用 serverless-http 包装 Express 应用
import serverless from 'serverless-http'
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
        console.error('[netlify] DB init failed:', err)
        dbPromise = null
        throw err
      })
  }
  await dbPromise
}

// 前缀归一化：无论 Netlify 传给函数的是原始路径（/api/pets）、
// 改写路径（/.netlify/functions/api/pets）还是未带前缀的路径（/pets），
// 都统一成 Express 能匹配的形式（Express 路由挂在 /api 与 /uploads 下）
const FN_PREFIX = '/.netlify/functions/api'

const wrappedHandler = serverless(app, {
  request: (request) => {
    let url = request.url || '/'

    // 情况 1：Netlify 传入了改写后的函数路径，剥离前缀还原真实请求路径
    if (url.startsWith(FN_PREFIX)) {
      url = url.slice(FN_PREFIX.length) || '/'
    }

    // 情况 2：已经带 /api 前缀，或指向 uploads 静态文件，直接放行
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/')) {
      request.url = url
      return request
    }

    // 情况 3：未带前缀（如 /pets、/health），补上 /api
    request.url = '/api' + (url === '/' ? '' : url)
    return request
  },
})

export async function handler(event, context) {
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
  return wrappedHandler(event, context)
}

export { handler as default }
