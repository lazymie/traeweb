import { Router, type Request, type Response } from 'express';
import { petRepository } from '../src/repositories/petRepo.js';
import { commentRepository, favoriteRepository } from '../src/repositories/interactionRepo.js';
import { userRepository } from '../src/repositories/userRepo.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware, optionalAuth } from '../src/middlewares/auth.js';
import type { PetCategory, PetGender, PetStatus, AgeUnit, PetQuery } from '../../shared/types.js';

const router = Router();

// 宠物列表（公开）
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const query: PetQuery = {
      keyword: req.query.keyword as string | undefined,
      category: req.query.category as PetCategory | undefined,
      breed: req.query.breed as string | undefined,
      gender: req.query.gender as PetGender | undefined,
      ageMin: req.query.ageMin ? Number(req.query.ageMin) : undefined,
      ageMax: req.query.ageMax ? Number(req.query.ageMax) : undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as PetStatus | undefined,
      sort: (req.query.sort as 'latest' | 'popular') || 'latest',
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 12,
    };
    const result = await petRepository.list(query);
    // 附带发布者信息
    const publisherIds = [...new Set(result.list.map(p => p.publisherId))];
    const publishers = (await Promise.all(publisherIds.map(id => userRepository.findById(id)))).filter(Boolean);
    ok(res, {
      list: result.list.map(p => ({
        ...p,
        publisher: publishers.find(u => u?.id === p.publisherId),
      })),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (e) {
    next(e);
  }
});

// 我发布的宠物
router.get('/mine', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const result = await petRepository.list({
      publisherId: req.user!.userId,
      status: req.query.status as PetStatus | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: 50,
    });
    ok(res, result.list);
  } catch (e) {
    next(e);
  }
});

// 宠物详情
router.get('/:id', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const pet = await petRepository.findById(id);
    if (!pet) throw new ApiError(404, '宠物不存在');
    // 增加浏览量
    await petRepository.incrementView(id);
    pet.viewCount += 1;
    const publisher = await userRepository.findById(pet.publisherId);
    const comments = await commentRepository.listByPet(id);
    const commentWithUser = await Promise.all(comments.map(async c => ({
      ...c,
      user: await userRepository.findById(c.userId),
    })));
    let favorited = false;
    if (req.user) favorited = await favoriteRepository.isFavorited(req.user.userId, id);
    ok(res, {
      ...pet,
      publisher,
      comments: commentWithUser,
      favorited,
    });
  } catch (e) {
    next(e);
  }
});

// 发布宠物
router.post('/', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const b = req.body;
    if (!b.title || !b.category || !b.breed) {
      throw new ApiError(400, '标题、种类、品种为必填项');
    }
    const pet = await petRepository.create({
      title: b.title,
      category: b.category,
      breed: b.breed,
      age: Number(b.age) || 0,
      ageUnit: (b.ageUnit as AgeUnit) || 'year',
      gender: b.gender || 'unknown',
      health: b.health || '',
      vaccination: b.vaccination || '',
      sterilized: !!b.sterilized,
      personality: b.personality || '',
      description: b.description || '',
      location: b.location || '',
      images: Array.isArray(b.images) ? b.images : [],
      publisherId: req.user!.userId,
      status: 'pending',
    });
    ok(res, pet);
  } catch (e) {
    next(e);
  }
});

// 编辑宠物
router.put('/:id', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const pet = await petRepository.findById(id);
    if (!pet) throw new ApiError(404, '宠物不存在');
    // 发布者本人或管理员可编辑
    if (pet.publisherId !== req.user!.userId && req.user!.role !== 'admin') {
      throw new ApiError(403, '无权限编辑');
    }
    const b = req.body;
    const updated = await petRepository.update(id, {
      title: b.title,
      category: b.category,
      breed: b.breed,
      age: b.age !== undefined ? Number(b.age) : undefined,
      ageUnit: b.ageUnit,
      gender: b.gender,
      health: b.health,
      vaccination: b.vaccination,
      sterilized: b.sterilized,
      personality: b.personality,
      description: b.description,
      location: b.location,
      images: b.images,
    });
    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 删除宠物
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const pet = await petRepository.findById(id);
    if (!pet) throw new ApiError(404, '宠物不存在');
    if (pet.publisherId !== req.user!.userId && req.user!.role !== 'admin') {
      throw new ApiError(403, '无权限删除');
    }
    await petRepository.remove(id);
    ok(res, { id });
  } catch (e) {
    next(e);
  }
});

// 收藏
router.post('/:id/favorite', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const pet = await petRepository.findById(id);
    if (!pet) throw new ApiError(404, '宠物不存在');
    await favoriteRepository.add(req.user!.userId, id);
    ok(res, { favorited: true });
  } catch (e) {
    next(e);
  }
});

// 取消收藏
router.delete('/:id/favorite', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    await favoriteRepository.remove(req.user!.userId, id);
    ok(res, { favorited: false });
  } catch (e) {
    next(e);
  }
});

// 留言列表
router.get('/:id/comments', async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const comments = await commentRepository.listByPet(id);
    const withUser = await Promise.all(comments.map(async c => ({ ...c, user: await userRepository.findById(c.userId) })));
    ok(res, withUser);
  } catch (e) {
    next(e);
  }
});

// 发表留言
router.post('/:id/comments', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const { content, parentId } = req.body;
    if (!content || !content.trim()) throw new ApiError(400, '留言内容不能为空');
    const comment = await commentRepository.create({
      petId: id,
      userId: req.user!.userId,
      content: content.trim(),
      parentId,
    });
    ok(res, { ...comment, user: await userRepository.findById(comment.userId) });
  } catch (e) {
    next(e);
  }
});

export default router;
