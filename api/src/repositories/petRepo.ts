import { queryAll, queryOne, run } from '../db/index.js';
import type { Pet, PetCategory, PetGender, PetStatus, AgeUnit } from '../../../shared/types.js';

interface PetRow {
  id: number;
  title: string;
  category: PetCategory;
  breed: string | null;
  age: number | null;
  age_unit: AgeUnit | null;
  gender: PetGender | null;
  health: string | null;
  vaccination: string | null;
  sterilized: number;
  personality: string | null;
  description: string | null;
  location: string | null;
  images: string | null;
  publisher_id: number;
  status: PetStatus;
  review_note: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
}

export interface PetQueryOpts {
  keyword?: string;
  category?: PetCategory;
  breed?: string;
  gender?: PetGender;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  status?: PetStatus;
  publisherId?: number;
  sort?: 'latest' | 'popular';
  page?: number;
  pageSize?: number;
}

function toPet(row: PetRow | undefined): Pet | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    breed: row.breed ?? '',
    age: row.age ?? 0,
    ageUnit: (row.age_unit ?? 'year') as AgeUnit,
    gender: (row.gender ?? 'unknown') as PetGender,
    health: row.health ?? '',
    vaccination: row.vaccination ?? '',
    sterilized: !!row.sterilized,
    personality: row.personality ?? '',
    description: row.description ?? '',
    location: row.location ?? '',
    images: row.images ? JSON.parse(row.images) : [],
    publisherId: row.publisher_id,
    status: row.status,
    reviewNote: row.review_note ?? undefined,
    viewCount: row.view_count ?? 0,
    favoriteCount: row.favorite_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const petRepository = {
  async findById(id: number): Promise<Pet | undefined> {
    return toPet(await queryOne<PetRow>('SELECT * FROM pets WHERE id = ?', [id]));
  },

  async list(opts: PetQueryOpts = {}): Promise<{ list: Pet[]; total: number }> {
    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (opts.keyword) {
      where += ' AND (title LIKE ? OR breed LIKE ? OR personality LIKE ? OR description LIKE ?)';
      const kw = `%${opts.keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    if (opts.category) {
      where += ' AND category = ?';
      params.push(opts.category);
    }
    if (opts.breed) {
      where += ' AND breed LIKE ?';
      params.push(`%${opts.breed}%`);
    }
    if (opts.gender) {
      where += ' AND gender = ?';
      params.push(opts.gender);
    }
    if (opts.ageMin !== undefined) {
      where += ' AND age >= ?';
      params.push(opts.ageMin);
    }
    if (opts.ageMax !== undefined) {
      where += ' AND age <= ?';
      params.push(opts.ageMax);
    }
    if (opts.location) {
      where += ' AND location LIKE ?';
      params.push(`%${opts.location}%`);
    }
    if (opts.status) {
      where += ' AND status = ?';
      params.push(opts.status);
    } else if (!opts.publisherId) {
      // 默认只展示已上架的可领养
      where += " AND status = 'available'";
    }
    if (opts.publisherId) {
      where += ' AND publisher_id = ?';
      params.push(opts.publisherId);
    }

    const countRow = await queryOne<{ c: number }>(`SELECT COUNT(*) as c FROM pets ${where}`, params);
    const total = countRow?.c ?? 0;

    let sql = `SELECT * FROM pets ${where}`;
    sql += opts.sort === 'popular' ? ' ORDER BY favorite_count DESC, view_count DESC' : ' ORDER BY created_at DESC';

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 12;
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`;

    const rows = await queryAll<PetRow>(sql, params);
    return { list: rows.map(toPet).filter(Boolean) as Pet[], total };
  },

  async create(data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'status'> & { status?: PetStatus }): Promise<Pet> {
    const r = await run(
      `INSERT INTO pets (title, category, breed, age, age_unit, gender, health, vaccination, sterilized, personality, description, location, images, publisher_id, status, view_count, favorite_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [data.title, data.category, data.breed, data.age, data.ageUnit, data.gender, data.health, data.vaccination, data.sterilized ? 1 : 0, data.personality, data.description, data.location, JSON.stringify(data.images ?? []), data.publisherId, data.status ?? 'pending']
    );
    return (await this.findById(r.lastId))!;
  },

  async update(id: number, data: Partial<Omit<Pet, 'id' | 'createdAt' | 'publisherId'>>): Promise<Pet | undefined> {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, string> = {
      title: 'title', category: 'category', breed: 'breed', age: 'age', ageUnit: 'age_unit',
      gender: 'gender', health: 'health', vaccination: 'vaccination', personality: 'personality',
      description: 'description', location: 'location', status: 'status', reviewNote: 'review_note',
    };
    for (const [k, v] of Object.entries(data)) {
      if (k === 'sterilized') { fields.push('sterilized = ?'); params.push(v ? 1 : 0); continue; }
      if (k === 'images') { fields.push('images = ?'); params.push(JSON.stringify(v)); continue; }
      if (k === 'viewCount') { fields.push('view_count = ?'); params.push(v); continue; }
      if (k === 'favoriteCount') { fields.push('favorite_count = ?'); params.push(v); continue; }
      if (map[k]) { fields.push(`${map[k]} = ?`); params.push(v); }
    }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    await run(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id: number): Promise<void> {
    await run('DELETE FROM pets WHERE id = ?', [id]);
  },

  async incrementView(id: number): Promise<void> {
    await run("UPDATE pets SET view_count = view_count + 1 WHERE id = ?", [id]);
  },

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await queryAll<{ status: string; c: number }>('SELECT status, COUNT(*) as c FROM pets GROUP BY status');
    const result: Record<string, number> = {};
    for (const r of rows) result[r.status] = r.c;
    return result;
  },

  async countByCategory(): Promise<{ category: string; count: number }[]> {
    return queryAll<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM pets GROUP BY category ORDER BY count DESC'
    );
  },
};
