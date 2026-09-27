import { queryAll, queryOne, run } from '../db/index.js';
import type { User, UserRole, UserStatus } from '../../../shared/types.js';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  nickname: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
  status: UserStatus;
  created_at: string;
}

function toUser(row: UserRow | undefined): User | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const userRepository = {
  async findByUsername(username: string): Promise<{ user: User; passwordHash: string } | undefined> {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE username = ?', [username]);
    if (!row) return undefined;
    return { user: toUser(row)!, passwordHash: row.password_hash };
  },

  async findById(id: number): Promise<User | undefined> {
    return toUser(await queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id]));
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return toUser(await queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [email]));
  },

  async list(opts: { keyword?: string; role?: string; status?: string } = {}): Promise<User[]> {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: unknown[] = [];
    if (opts.keyword) {
      sql += ' AND (username LIKE ? OR nickname LIKE ? OR email LIKE ?)';
      const kw = `%${opts.keyword}%`;
      params.push(kw, kw, kw);
    }
    if (opts.role) {
      sql += ' AND role = ?';
      params.push(opts.role);
    }
    if (opts.status) {
      sql += ' AND status = ?';
      params.push(opts.status);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = await queryAll<UserRow>(sql, params);
    return rows.map(toUser).filter(Boolean) as User[];
  },

  async create(data: {
    username: string;
    passwordHash: string;
    nickname: string;
    email: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
    bio?: string;
  }): Promise<User> {
    const r = await run(
      `INSERT INTO users (username, password_hash, nickname, email, phone, role, avatar, bio, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [data.username, data.passwordHash, data.nickname, data.email, data.phone ?? null, data.role ?? 'user', data.avatar ?? null, data.bio ?? null]
    );
    return (await this.findById(r.lastId))!;
  },

  async update(id: number, data: Partial<Pick<User, 'nickname' | 'email' | 'phone' | 'avatar' | 'bio' | 'role' | 'status'>>): Promise<User | undefined> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (data.nickname !== undefined) { fields.push('nickname = ?'); params.push(data.nickname); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); params.push(data.avatar); }
    if (data.bio !== undefined) { fields.push('bio = ?'); params.push(data.bio); }
    if (data.role !== undefined) { fields.push('role = ?'); params.push(data.role); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (fields.length === 0) return this.findById(id);
    params.push(id);
    await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async count(): Promise<number> {
    const r = await queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users');
    return r?.c ?? 0;
  },
};
