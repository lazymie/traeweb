/**
 * Express 应用配置
 */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import petRoutes from './routes/pets.js'
import adoptionRoutes from './routes/adoptions.js'
import announcementRoutes from './routes/announcements.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import { errorMiddleware, notFoundMiddleware } from './src/middlewares/error.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 环境检测：Vercel / Netlify Serverless 环境
const IS_VERCEL = !!process.env.VERCEL
const IS_NETLIFY = !!process.env.NETLIFY || !!process.env.CONTEXT
const IS_SERVERLESS = IS_VERCEL || IS_NETLIFY

// 静态文件：上传的图片
// Serverless 环境：写入 /tmp（临时，实例回收后丢失）
// 本地路径基于 process.cwd()（项目根目录）解析。
// 注意：不要声明 __filename/__dirname —— Netlify 的 esbuild 打包会注入同名 shim，重复声明直接报 SyntaxError
const UPLOADS_DIR = IS_SERVERLESS
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(UPLOADS_DIR))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/pets', petRoutes)
app.use('/api/adoptions', adoptionRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)

/**
 * health
 */
app.use('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

/**
 * 静态资源托管 + SPA 回退（仅本地/自有服务器模式启用）
 * Netlify/Vercel 环境下，静态文件由平台直接托管，不需要 Express 提供
 */
const DIST_DIR = path.resolve(process.cwd(), 'dist')
if (!IS_SERVERLESS && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  // SPA 回退：非 /api、/uploads 的 GET 请求返回 index.html
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

app.use(notFoundMiddleware)

/**
 * error handler middleware
 */
app.use(errorMiddleware)

export default app
