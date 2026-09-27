import { queryAll, queryOne, run } from '../db/index.js';
import type { Comment, Favorite } from '../../../shared/types.js';

interface CommentRow {
  id: number;
  pet_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
}

interface FavoriteRow {
  id: number;
  user_id: number;
  pet_id: number;
  created_at: string;
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    petId: row.pet_id,
    userId: row.user_id,
    content: row.content,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at,
  };
}

function toFavorite(row: FavoriteRow): Favorite {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    createdAt: row.created_at,
  };
}

export const commentRepository = {
  async listByPet(petId: number): Promise<Comment[]> {
    const rows = await queryAll<CommentRow>(
      'SELECT * FROM comments WHERE pet_id = ? ORDER BY created_at ASC',
      [petId]
    );
    return rows.map(toComment);
  },

  async create(data: { petId: number; userId: number; content: string; parentId?: number }): Promise<Comment> {
    const r = await run(
      'INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [data.petId, data.userId, data.content, data.parentId ?? null]
    );
    return {
      id: r.lastId,
      petId: data.petId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId,
      createdAt: new Date().toISOString(),
    };
  },
};

export const favoriteRepository = {
  async isFavorited(userId: number, petId: number): Promise<boolean> {
    const r = await queryOne<{ c: number }>(
      'SELECT COUNT(*) as c FROM favorites WHERE user_id = ? AND pet_id = ?',
      [userId, petId]
    );
    return (r?.c ?? 0) > 0;
  },

  async listByUser(userId: number): Promise<Favorite[]> {
    const rows = await queryAll<FavoriteRow>(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows.map(toFavorite);
  },

  async listUserFavorites(userId: number): Promise<number[]> {
    const rows = await queryAll<{ pet_id: number }>(
      'SELECT pet_id FROM favorites WHERE user_id = ?',
      [userId]
    );
    return rows.map(r => r.pet_id);
  },

  async add(userId: number, petId: number): Promise<void> {
    await run('INSERT OR IGNORE INTO favorites (user_id, pet_id) VALUES (?, ?)', [userId, petId]);
    await run('UPDATE pets SET favorite_count = favorite_count + 1 WHERE id = ?', [petId]);
  },

  async remove(userId: number, petId: number): Promise<void> {
    const existing = await this.isFavorited(userId, petId);
    if (!existing) return;
    await run('DELETE FROM favorites WHERE user_id = ? AND pet_id = ?', [userId, petId]);
    await run('UPDATE pets SET favorite_count = MAX(favorite_count - 1, 0) WHERE id = ?', [petId]);
  },
};
