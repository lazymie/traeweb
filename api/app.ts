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
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import petRoutes from './routes/pets.js'
import adoptionRoutes from './routes/adoptions.js'
import announcementRoutes from './routes/announcements.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import { errorMiddleware, notFoundMiddleware } from './src/middlewares/error.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件：上传的图片
const IS_VERCEL = !!process.env.VERCEL;
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.resolve(__dirname, '../uploads');
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
 * 404 handler
 */
// 本地生产部署：托管前端构建产物 dist/（仅当目录存在时）
const DIST_DIR = path.resolve(__dirname, '../dist');
if (!IS_VERCEL && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA 回退：非 /api、/uploads 的 GET 请求返回 index.html
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use(notFoundMiddleware)

/**
 * error handler middleware
 */
app.use(errorMiddleware)

export default app
