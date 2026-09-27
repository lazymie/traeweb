import { createClient, type Client } from '@libsql/client';

let client: Client;
let initialized = false;

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

export async function initDb(): Promise<void> {
  if (initialized) return;

  // 优先读取 Turso 环境变量；本地无配置时回退到本地 file: 数据库
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

  if (url && (url.startsWith('libsql://') || url.startsWith('https://'))) {
    client = createClient({ url, authToken });
    console.log('[db] Turso client initialized for', url.replace(/:\/\/.*@/, '://'));
  } else {
    // 本地开发：使用 file: 协议
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
    console.log('[db] Local SQLite client initialized at', localPath);
  }

  // 建表（多条语句一次执行：libsql 支持批量）
  // 由于 createClient 不支持多语句直接 execute，逐条 split
  const statements = SCHEMA.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // 检查是否需要 seed（users 表是否有数据）
  const check = await client.execute('SELECT COUNT(*) as c FROM users');
  const count = (check.rows[0]?.c as number | undefined) ?? 0;
  if (count === 0) {
    const { seed } = await import('./seed.js');
    await seed();
  }

  initialized = true;
  console.log('[db] Database initialized.');
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
