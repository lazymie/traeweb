import { Router, type Request, type Response } from 'express';
import { petRepository } from '../src/repositories/petRepo.js';
import { userRepository } from '../src/repositories/userRepo.js';
import { adoptionRepository } from '../src/repositories/adoptionRepo.js';
import { announcementRepository } from '../src/repositories/announcementRepo.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware, roleMiddleware } from '../src/middlewares/auth.js';
import type { PetStatus, UserRole, UserStatus, AdoptionStatus } from '../../shared/types.js';

const router = Router();

// 后台首页统计
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (_req: Request, res: Response, next) => {
  try {
    const [petStatus, adoptionStatus, totalUsers, petsByCategory, applicationsTrend] = await Promise.all([
      petRepository.countByStatus(),
      adoptionRepository.countByStatus(),
      userRepository.count(),
      petRepository.countByCategory(),
      adoptionRepository.recentApplications(30),
    ]);
    const totalPets = Object.values(petStatus).reduce((a, b) => a + b, 0);
    const totalApplications = Object.values(adoptionStatus).reduce((a, b) => a + b, 0);
    const completedAdoptions = adoptionStatus['completed'] ?? 0;
    ok(res, {
      totalPets,
      availablePets: petStatus['available'] ?? 0,
      pendingPets: petStatus['pending'] ?? 0,
      adoptedPets: petStatus['adopted'] ?? 0,
      totalUsers,
      totalApplications,
      pendingApplications: adoptionStatus['pending'] ?? 0,
      completedAdoptions,
      adoptionRate: totalApplications > 0 ? Math.round((completedAdoptions / totalApplications) * 100) : 0,
      petsByCategory: petsByCategory.map(r => ({ category: r.category, count: r.count })),
      applicationsTrend,
    });
  } catch (e) {
    next(e);
  }
});

// 待审核 + 全部宠物（管理员视角）
router.get('/pets', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const status = (req.query.status as PetStatus | undefined) ?? 'pending';
    const result = await petRepository.list({ status, page: 1, pageSize: 100, sort: 'latest' });
    const publishers = (await Promise.all(
      [...new Set(result.list.map(p => p.publisherId))].map(id => userRepository.findById(id))
    )).filter(Boolean);
    ok(res, result.list.map(p => ({
      ...p,
      publisher: publishers.find(u => u?.id === p.publisherId),
    })));
  } catch (e) {
    next(e);
  }
});

// 审核宠物（通过/驳回）
router.put('/pets/:id/review', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const { status, reviewNote } = req.body as { status: PetStatus; reviewNote?: string };
    if (!['available', 'rejected'].includes(status)) {
      throw new ApiError(400, '审核状态只能为 available 或 rejected');
    }
    const updated = await petRepository.update(id, { status, reviewNote });
    if (!updated) throw new ApiError(404, '宠物不存在');
    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 上下架
router.put('/pets/:id/status', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: PetStatus };
    if (!['available', 'offline'].includes(status)) {
      throw new ApiError(400, '上下架状态只能为 available 或 offline');
    }
    const updated = await petRepository.update(id, { status });
    if (!updated) throw new ApiError(404, '宠物不存在');
    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 用户管理
router.get('/users', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const list = await userRepository.list({
      keyword: req.query.keyword as string | undefined,
      role: req.query.role as string | undefined,
      status: req.query.status as string | undefined,
    });
    ok(res, list);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:id', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const { role, status, nickname, email, phone } = req.body;
    const updated = await userRepository.update(id, {
      role: role as UserRole | undefined,
      status: status as UserStatus | undefined,
      nickname, email, phone,
    });
    if (!updated) throw new ApiError(404, '用户不存在');
    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 领养管理列表（管理员）
router.get('/adoptions', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response, next) => {
  try {
    const list = await adoptionRepository.list({
      status: req.query.status as AdoptionStatus | undefined,
    });
    const enriched = await Promise.all(list.map(async a => ({
      ...a,
      pet: await petRepository.findById(a.petId),
      applicant: await userRepository.findById(a.applicantId),
    })));
    ok(res, enriched);
  } catch (e) {
    next(e);
  }
});

export default router;
