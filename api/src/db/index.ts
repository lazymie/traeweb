// 只引入类型（type-only import 编译后完全擦除，不会进入打包产物）。
// 运行时的 createClient 改为按环境懒加载，见下方 loadCreateClient()。
import type { Client } from '@libsql/client';

let client: Client;
let initialized = false;
let initPromise: Promise<void> | null = null;

// 环境检测：serverless 平台（Netlify/Vercel/Lambda）文件系统只读，
// 必须使用纯 JS 的 web 版客户端（走 HTTP，无原生 .node 绑定）。
const IS_SERVERLESS = !!(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

type CreateClientFn = (config: { url: string; authToken?: string }) => Client;
let clientFactoryPromise: Promise<CreateClientFn> | null = null;

/**
 * 按运行环境懒加载 libSQL 客户端工厂：
 * - Serverless（Netlify/Vercel）：@libsql/client/web —— 纯 JS，只支持 libsql:/https: 远程库，
 *   绝不依赖 @libsql/linux-x64-gnu 等平台原生包（那是线上冷启动崩溃的根因）。
 * - 本地：@libsql/client（Node 原生版）—— 只有它支持 file: 本地 SQLite 文件。
 *
 * 用动态 import() 而不是顶层静态 import：原生版客户端的模块顶层会立即 require
 * 平台二进制包；放在永远不会执行的分支里懒加载，Netlify 打包后该模块工厂不会被调用。
 */
async function loadCreateClient(): Promise<CreateClientFn> {
  if (!clientFactoryPromise) {
    clientFactoryPromise = IS_SERVERLESS
      ? import('@libsql/client/web').then((m) => m.createClient as CreateClientFn)
      : import('@libsql/client').then((m) => m.createClient as CreateClientFn);
  }
  return clientFactoryPromise;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  age_unit TEXT DEFAULT 'year',
  gender TEXT,
  health TEXT,
  vaccination TEXT,
  sterilized INTEGER DEFAULT 0,
  personality TEXT,
  description TEXT,
  location TEXT,
  images TEXT,
  publisher_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (publisher_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_category ON pets(category);
CREATE INDEX IF NOT EXISTS idx_pets_publisher ON pets(publisher_id);

CREATE TABLE IF NOT EXISTS adoptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  applicant_id INTEGER NOT NULL,
  reason TEXT,
  experience TEXT,
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pet_id) REFERENCES pets(id),
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_adoptions_pet ON adoptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_applicant ON adoptions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_status ON adoptions(status);

CREATE TABLE IF NOT EXISTS followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adoption_id INTEGER NOT NULL,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (adoption_id) REFERENCES adoptions(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  pinned INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  publisher_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (publisher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pet_id) REFERENCES pets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_comments_pet ON comments(pet_id);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pet_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, pet_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_id) REFERENCES pets(id)
);
`;

/**
 * 初始化入口（并发安全）：
 * 同一实例上的并发请求共享同一个初始化 Promise，不会重复建表/重复 seed；
 * 失败后清空缓存，允许下次请求重试。
 */
export function initDb(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (!initPromise) {
    initPromise = doInit().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

async function doInit(): Promise<void> {
  try {
    // 按环境拿到对应的 createClient（serverless=web 纯 JS 版，本地=Node 原生版）
    const createClient = await loadCreateClient();

    // 优先读取 Turso 环境变量；本地无配置时回退到本地 file: 数据库
    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

    if (url && (url.startsWith('libsql://') || url.startsWith('https://'))) {
      // 注意：不打印 authToken，只打印脱敏后的 URL
      console.log('[db][init] Step 1/3 连接远程 Turso 数据库:', url.replace(/:\/\/.*@/, '://'));
      client = createClient({ url, authToken });
      console.log('[db][init] 远程数据库客户端创建成功');
    } else if (IS_SERVERLESS) {
      // serverless 上漏配 Turso 变量 → 立即明确报错，避免回退到只读文件系统上的 file: 数据库
      console.error('[db][init] 配置错误: serverless 环境未检测到 TURSO_DATABASE_URL');
      console.error('[db][init] 请在 Netlify 控制台 Site settings → Environment variables 配置:');
      console.error('[db][init]   TURSO_DATABASE_URL = libsql://<你的数据库名>.turso.io');
      console.error('[db][init]   TURSO_AUTH_TOKEN  = <你的数据库访问令牌>');
      throw new Error('缺少 TURSO_DATABASE_URL 环境变量：Netlify 环境不支持本地 SQLite 文件，请配置 Turso 远程数据库');
    } else {
      // 本地开发：使用 file: 协议（仅 Node 原生版客户端支持）
      const localPath = process.env.LOCAL_DB_PATH || 'file:./data/app.db';
      // 确保目录存在
      if (localPath.startsWith('file:')) {
        const fs = await import('fs');
        const path = await import('path');
        const filePart = localPath.slice('file:'.length);
        const dir = path.dirname(filePart);
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      client = createClient({ url: localPath });
      console.log('[db][init] Step 1/3 连接本地 SQLite 数据库:', localPath);
    }

    // Step 2: 建表（CREATE TABLE IF NOT EXISTS，幂等，已存在则跳过）
    const statements = SCHEMA.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    console.log(`[db][init] Step 2/3 建表完成（共 ${statements.length} 条语句，已存在的表自动跳过）`);

    // Step 3: 种子检查——users 或 pets 任一为空都执行全量种子写入
    const userCheck = await client.execute('SELECT COUNT(*) as c FROM users');
    const petCheck = await client.execute('SELECT COUNT(*) as c FROM pets');
    const userCount = (userCheck.rows[0]?.c as number | undefined) ?? 0;
    const petCount = (petCheck.rows[0]?.c as number | undefined) ?? 0;
    console.log(`[db][init] Step 3/3 种子数据检查: users=${userCount} 条, pets=${petCount} 条`);

    if (userCount === 0 || petCount === 0) {
      console.log('[db][init] 数据库为空，开始写入种子数据（3 个用户、8 只宠物、3 条公告等）...');
      // 关键：建表已完成，先标记 initialized 再 seed。
      // 否则 seed 内部的 run()/queryAll() 会因 initialized=false 再次调用 initDb()，造成无限递归
      initialized = true;
      const { seed } = await import('./seed.js');
      await seed();
    } else {
      console.log('[db][init] 数据已存在，跳过种子写入');
      initialized = true;
    }

    console.log('[db][init] 数据库初始化全部完成');
  } catch (e) {
    // 失败时输出明确的诊断日志后原样抛出，由上层（server/netlify handler）处理
    console.error('[db][init] 数据库初始化失败:', e instanceof Error ? e.message : e);
    if (e instanceof Error && e.message.includes('fetch failed')) {
      console.error('[db][init] 提示: "fetch failed" 通常是 Turso 地址错误或 TURSO_AUTH_TOKEN 无效，请检查环境变量');
    }
    throw e;
  }
}

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!initialized) await initDb();
  const result = await client.execute({ sql, args: params as any });
  return result.rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await queryAll<T>(sql, params);
  return rows[0];
}

export async function run(
  sql: string,
  params: unknown[] = []
): Promise<{ lastId: number; changes: number }> {
  if (!initialized) await initDb();
  const result = await client.execute({ sql, args: params as any });
  // libSQL 的 lastInsertRowid 可能是 bigint 或 number
  const raw = result.lastInsertRowid;
  const lastId = typeof raw === 'bigint' ? Number(raw) : (raw as number) ?? 0;
  const changesRaw = (result as { rowsAffected?: number | bigint }).rowsAffected;
  const changes = typeof changesRaw === 'bigint' ? Number(changesRaw) : (changesRaw as number) ?? 0;
  return { lastId, changes };
}
