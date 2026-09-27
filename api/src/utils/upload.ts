import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// Serverless（Vercel/Netlify）：文件系统只读，仅 /tmp 可写。
// 注意：不要声明 __filename/__dirname —— Netlify 的 esbuild 打包会注入同名 shim，重复声明直接报 SyntaxError。
// 本地路径基于 process.cwd()（项目根目录）解析。
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NETLIFY || process.env.CONTEXT);
const UPLOAD_DIR = IS_SERVERLESS
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    // 只读文件系统下忽略
  }
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/webp/gif 图片格式'));
    }
  },
});
