import { queryAll, queryOne, run } from '../db/index.js';
import type { Announcement, AnnouncementStatus } from '../../../shared/types.js';

interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  pinned: number;
  status: AnnouncementStatus;
  publisher_id: number;
  created_at: string;
}

function toAnn(row: AnnouncementRow | undefined): Announcement | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt ?? '',
    pinned: !!row.pinned,
    status: row.status,
    publisherId: row.publisher_id,
    createdAt: row.created_at,
  };
}

export const announcementRepository = {
  async findById(id: number): Promise<Announcement | undefined> {
    return toAnn(await queryOne<AnnouncementRow>('SELECT * FROM announcements WHERE id = ?', [id]));
  },

  async list(opts: { status?: AnnouncementStatus; includeAll?: boolean } = {}): Promise<Announcement[]> {
    let sql = 'SELECT * FROM announcements';
    const params: unknown[] = [];
    if (!opts.includeAll || opts.status) {
      sql += opts.status ? ' WHERE status = ?' : " WHERE status = 'published'";
      if (opts.status) params.push(opts.status);
    }
    sql += ' ORDER BY pinned DESC, created_at DESC';
    const rows = await queryAll<AnnouncementRow>(sql, params);
    return rows.map(toAnn).filter(Boolean) as Announcement[];
  },

  async create(data: { title: string; content: string; excerpt: string; pinned?: boolean; publisherId: number }): Promise<Announcement> {
    const r = await run(
      `INSERT INTO announcements (title, content, excerpt, pinned, status, publisher_id)
       VALUES (?, ?, ?, ?, 'published', ?)`,
      [data.title, data.content, data.excerpt, data.pinned ? 1 : 0, data.publisherId]
    );
    return (await this.findById(r.lastId))!;
  },

  async update(id: number, data: Partial<Pick<Announcement, 'title' | 'content' | 'excerpt' | 'pinned' | 'status'>>): Promise<Announcement | undefined> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.content !== undefined) { fields.push('content = ?'); params.push(data.content); }
    if (data.excerpt !== undefined) { fields.push('excerpt = ?'); params.push(data.excerpt); }
    if (data.pinned !== undefined) { fields.push('pinned = ?'); params.push(data.pinned ? 1 : 0); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (fields.length === 0) return this.findById(id);
    params.push(id);
    await run(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id: number): Promise<void> {
    await run('DELETE FROM announcements WHERE id = ?', [id]);
  },
};
