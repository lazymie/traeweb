import { queryAll, queryOne, run } from '../db/index.js';
import type { Adoption, AdoptionStatus, Followup } from '../../../shared/types.js';

interface AdoptionRow {
  id: number;
  pet_id: number;
  applicant_id: number;
  reason: string | null;
  experience: string | null;
  contact: string | null;
  status: AdoptionStatus;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

interface FollowupRow {
  id: number;
  adoption_id: number;
  content: string | null;
  created_at: string;
}

function toFollowup(row: FollowupRow): Followup {
  return {
    id: row.id,
    adoptionId: row.adoption_id,
    content: row.content ?? '',
    createdAt: row.created_at,
  };
}

function toAdoption(row: AdoptionRow | undefined, followups: Followup[] = []): Adoption | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    petId: row.pet_id,
    applicantId: row.applicant_id,
    reason: row.reason ?? '',
    experience: row.experience ?? '',
    contact: row.contact ?? '',
    status: row.status,
    reviewNote: row.review_note ?? undefined,
    followups,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const adoptionRepository = {
  async findById(id: number): Promise<Adoption | undefined> {
    const row = await queryOne<AdoptionRow>('SELECT * FROM adoptions WHERE id = ?', [id]);
    if (!row) return undefined;
    const followups = (await queryAll<FollowupRow>('SELECT * FROM followups WHERE adoption_id = ? ORDER BY created_at', [id])).map(toFollowup);
    return toAdoption(row, followups);
  },

  async list(opts: { applicantId?: number; petId?: number; publisherId?: number; status?: AdoptionStatus } = {}): Promise<Adoption[]> {
    let sql = `SELECT a.* FROM adoptions a WHERE 1=1`;
    const params: unknown[] = [];
    if (opts.applicantId) { sql += ' AND a.applicant_id = ?'; params.push(opts.applicantId); }
    if (opts.petId) { sql += ' AND a.pet_id = ?'; params.push(opts.petId); }
    if (opts.status) { sql += ' AND a.status = ?'; params.push(opts.status); }
    if (opts.publisherId) {
      sql += ' AND a.pet_id IN (SELECT id FROM pets WHERE publisher_id = ?)';
      params.push(opts.publisherId);
    }
    sql += ' ORDER BY a.created_at DESC';
    const rows = await queryAll<AdoptionRow>(sql, params);
    const result: Adoption[] = [];
    for (const r of rows) {
      const followups = (await queryAll<FollowupRow>('SELECT * FROM followups WHERE adoption_id = ? ORDER BY created_at', [r.id])).map(toFollowup);
      const a = toAdoption(r, followups);
      if (a) result.push(a);
    }
    return result;
  },

  async create(data: { petId: number; applicantId: number; reason: string; experience: string; contact: string }): Promise<Adoption> {
    const r = await run(
      `INSERT INTO adoptions (pet_id, applicant_id, reason, experience, contact, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [data.petId, data.applicantId, data.reason, data.experience, data.contact]
    );
    return (await this.findById(r.lastId))!;
  },

  async update(id: number, data: { status?: AdoptionStatus; reviewNote?: string }): Promise<Adoption | undefined> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (data.status) { fields.push('status = ?'); params.push(data.status); }
    if (data.reviewNote !== undefined) { fields.push('review_note = ?'); params.push(data.reviewNote); }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    await run(`UPDATE adoptions SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async addFollowup(adoptionId: number, content: string): Promise<Followup> {
    const r = await run('INSERT INTO followups (adoption_id, content) VALUES (?, ?)', [adoptionId, content]);
    return {
      id: r.lastId,
      adoptionId,
      content,
      createdAt: new Date().toISOString(),
    };
  },

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await queryAll<{ status: string; c: number }>('SELECT status, COUNT(*) as c FROM adoptions GROUP BY status');
    const result: Record<string, number> = {};
    for (const r of rows) result[r.status] = r.c;
    return result;
  },

  async recentApplications(days: number = 30): Promise<{ date: string; count: number }[]> {
    return queryAll<{ date: string; count: number }>(
      `SELECT date(created_at) as date, COUNT(*) as count 
       FROM adoptions 
       WHERE created_at >= date('now', '-${days} days')
       GROUP BY date(created_at) 
       ORDER BY date ASC`
    );
  },
};
