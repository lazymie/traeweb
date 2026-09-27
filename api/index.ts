/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app.js';
import { initDb } from './src/db/index.js';

let initialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDb(): Promise<void> {
  if (initialized) return;
  if (!initPromise) {
    initPromise = initDb()
      .then(() => { initialized = true; })
      .catch((err) => { initPromise = null; throw err; });
  }
  await initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureDb();
  } catch (err) {
    console.error('[vercel] DB init failed:', err);
    res.status(500).json({ code: 500, message: '数据库初始化失败', data: null });
    return;
  }
  return app(req as unknown as Parameters<typeof app>[0], res as unknown as Parameters<typeof app>[1]);
}
