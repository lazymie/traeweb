import { Router, type Request, type Response } from 'express';
import { announcementRepository } from '../src/repositories/announcementRepo.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware, roleMiddleware } from '../src/middlewares/auth.js';

const router = Router();

// 公告列表（公开）
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const list = await announcementRepository.list({ status: 'published' });
    ok(res, list);
  } catch (e) {
    next(e);
  }
});

// 公告详情
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const ann = await announcementRepository.findById(Number(req.params.id));
    if (!ann) throw new ApiError(404, '公告不存在');
    ok(res, ann);
  } catch (e) {
    next(e);
  }
});

// 后台管理列表（含未发布）
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const list = await announcementRepository.list({ includeAll: true });
    ok(res, list);
  } catch (e) {
    next(e);
  }
});

// 创建（管理员）
router.post('/', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const { title, content, excerpt, pinned } = req.body;
    if (!title || !content) throw new ApiError(400, '标题和内容为必填');
    const ann = await announcementRepository.create({
      title,
      content,
      excerpt: excerpt || content.slice(0, 80),
      pinned,
      publisherId: req.user!.userId,
    });
    ok(res, ann);
  } catch (e) {
    next(e);
  }
});

// 更新（管理员）
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const updated = await announcementRepository.update(Number(req.params.id), req.body);
    if (!updated) throw new ApiError(404, '公告不存在');
    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 删除（管理员）
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    await announcementRepository.remove(Number(req.params.id));
    ok(res, { id: Number(req.params.id) });
  } catch (e) {
    next(e);
  }
});

export default router;
