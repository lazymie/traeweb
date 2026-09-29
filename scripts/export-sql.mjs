/**
 * 导出本地 SQLite 数据库为标准 SQL 文件（建表语句 + 全量数据）
 *
 * 用法:  node scripts/export-sql.mjs
 * 输出:  项目根目录下的 seed.sql
 * 导入:  turso db shell <你的数据库名> < seed.sql
 */
// 本脚本仅在本地运行（读取 file:./data/app.db），必须使用 Node 原生版客户端。
// 注意：@libsql/client/web 不支持 file: 协议，切勿替换。
// 此文件不会被 Netlify 函数打包（函数入口是 netlify/functions/api.ts，不引用 scripts/）。
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const DB_URL = process.env.LOCAL_DB_PATH || 'file:./data/app.db';
const OUT_FILE = path.resolve(process.cwd(), 'seed.sql');

// 已知的表依赖顺序（被外键引用的表先插入：users 供 pets/announcements 等引用），
// 未知表按字母序追加在最后
const KNOWN_ORDER = [
  'users', 'pets', 'announcements', 'comments', 'favorites', 'adoptions', 'followups',
];

const client = createClient({ url: DB_URL });

/** 值转 SQL 字面量：NULL / 数字 / BLOB / 字符串（单引号转义为两个单引号） */
function toSqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString('hex')}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  console.log(`[export] 连接数据库: ${DB_URL}`);

  // 1. 读取建表/建索引语句（sqlite_master 按原始创建顺序）
  const schemaRes = await client.execute(
    `SELECT type, name, sql FROM sqlite_master
     WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
     ORDER BY rowid`
  );
  const tables = schemaRes.rows.filter(r => r.type === 'table').map(r => String(r.name));
  const ordered = [
    ...KNOWN_ORDER.filter(t => tables.includes(t)),
    ...tables.filter(t => !KNOWN_ORDER.includes(t)).sort(),
  ];

  const lines = [
    '-- ============================================',
    '-- 暖窝 · 宠物领养平台 数据库导出',
    `-- 导出时间: ${new Date().toLocaleString('zh-CN')}`,
    `-- 来源数据库: ${DB_URL}`,
    '-- 导入 Turso 示例: turso db shell <数据库名> < seed.sql',
    '-- ============================================',
    '',
    'BEGIN TRANSACTION;',
    '',
  ];

  // 2. 建表 + 索引语句
  lines.push('-- ---------- 建表语句 ----------');
  for (const r of schemaRes.rows) {
    lines.push(`${String(r.sql).replace(/;\s*$/, '')};`);
    lines.push('');
  }

  // 3. 清空旧数据（按依赖逆序删除，保证脚本可重复导入、不会撞 UNIQUE 约束）
  lines.push('-- ---------- 清空旧数据（保证可重复导入） ----------');
  for (const t of [...ordered].reverse()) {
    lines.push(`DELETE FROM ${t};`);
  }
  lines.push('');

  // 4. 逐表导出数据
  lines.push('-- ---------- 数据插入 ----------');
  const stats = [];
  for (const t of ordered) {
    const res = await client.execute(`SELECT * FROM ${t} ORDER BY rowid`);
    for (const row of res.rows) {
      const cols = res.columns.map(c => `"${c}"`).join(', ');
      const vals = res.columns.map(c => toSqlLiteral(row[c])).join(', ');
      lines.push(`INSERT INTO ${t} (${cols}) VALUES (${vals});`);
    }
    if (res.rows.length > 0) lines.push('');
    stats.push(`${t}: ${res.rows.length} 行`);
  }

  // 5. 同步自增计数器（避免导入后新增记录的 id 与已有数据冲突）
  const seqExists = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'`
  );
  if (seqExists.rows.length > 0) {
    const seqRes = await client.execute('SELECT name, seq FROM sqlite_sequence');
    if (seqRes.rows.length > 0) {
      lines.push('-- ---------- 自增计数器同步 ----------');
      lines.push('DELETE FROM sqlite_sequence;');
      for (const row of seqRes.rows) {
        lines.push(
          `INSERT INTO sqlite_sequence (name, seq) VALUES (${toSqlLiteral(row.name)}, ${toSqlLiteral(row.seq)});`
        );
      }
      lines.push('');
    }
  }

  lines.push('COMMIT;', '');

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');

  const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log('[export] 导出成功 ✔');
  console.log(`[export] 输出文件: ${OUT_FILE} (${size} KB)`);
  for (const s of stats) console.log(`[export]   - ${s}`);
  console.log('[export] 导入 Turso 示例: turso db shell <你的数据库名> < seed.sql');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[export] 导出失败:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
