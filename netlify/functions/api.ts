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

// Netlify 重定向可能会去掉 /api 前缀，这里统一补回
const wrappedHandler = serverless(app, {
  request: (request) => {
    const url = request.url || ''
    if (!url.startsWith('/api')) {
      request.url = '/api' + (url === '/' ? '' : url)
    }
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
