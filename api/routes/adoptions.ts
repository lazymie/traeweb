import { Router, type Request, type Response } from 'express';
import { adoptionRepository } from '../src/repositories/adoptionRepo.js';
import { petRepository } from '../src/repositories/petRepo.js';
import { userRepository } from '../src/repositories/userRepo.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware } from '../src/middlewares/auth.js';
import type { AdoptionStatus } from '../../shared/types.js';

const router = Router();

// 申请列表：管理员看全部，发布者看自己宠物的申请，普通用户看自己提交的
router.get('/', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const opts: { applicantId?: number; publisherId?: number; status?: AdoptionStatus } = {};
    if (req.query.status) opts.status = req.query.status as AdoptionStatus;
    if (req.user!.role === 'admin') {
      // 管理员看全部
    } else if (req.user!.role === 'org') {
      opts.publisherId = req.user!.userId;
    } else {
      opts.applicantId = req.user!.userId;
    }
    const list = await adoptionRepository.list(opts);
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

// 提交申请
router.post('/', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const { petId, reason, experience, contact } = req.body;
    if (!petId || !reason || !contact) {
      throw new ApiError(400, '宠物 ID、申请说明、联系方式为必填');
    }
    const pet = await petRepository.findById(Number(petId));
    if (!pet) throw new ApiError(404, '宠物不存在');
    if (pet.status !== 'available') {
      throw new ApiError(400, '该宠物当前不可申请领养');
    }
    // 不能申请自己发布的
    if (pet.publisherId === req.user!.userId) {
      throw new ApiError(400, '不能申请自己发布的宠物');
    }
    const existing = await adoptionRepository.list({ applicantId: req.user!.userId, petId: pet.id });
    if (existing.some(a => a.status === 'pending' || a.status === 'approved')) {
      throw new ApiError(400, '您已对该宠物提交过待处理的申请');
    }
    const adoption = await adoptionRepository.create({
      petId: pet.id,
      applicantId: req.user!.userId,
      reason,
      experience: experience || '',
      contact,
    });
    ok(res, adoption);
  } catch (e) {
    next(e);
  }
});

// 更新申请状态（管理员或发布者）
router.put('/:id', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const adoption = await adoptionRepository.findById(id);
    if (!adoption) throw new ApiError(404, '申请不存在');
    const pet = await petRepository.findById(adoption.petId);
    if (!pet) throw new ApiError(404, '宠物不存在');

    const isOwner = pet.publisherId === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, '无权处理该申请');
    }

    const { status, reviewNote } = req.body as { status?: AdoptionStatus; reviewNote?: string };
    if (!status) throw new ApiError(400, '请提供新的状态');

    const updated = await adoptionRepository.update(id, { status, reviewNote });

    // 审核通过后完成领养：将宠物状态改为 adopted
    if (status === 'completed') {
      await petRepository.update(pet.id, { status: 'adopted' });
    }
    // 如果申请被拒/取消，且宠物之前因为审核中暂不可申请，恢复为 available
    if ((status === 'rejected' || status === 'cancelled') && pet.status === 'pending') {
      await petRepository.update(pet.id, { status: 'available' });
    }

    ok(res, updated);
  } catch (e) {
    next(e);
  }
});

// 添加回访记录（管理员或发布者）
router.post('/:id/followups', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const id = Number(req.params.id);
    const adoption = await adoptionRepository.findById(id);
    if (!adoption) throw new ApiError(404, '申请不存在');
    const pet = await petRepository.findById(adoption.petId);
    if (!pet) throw new ApiError(404, '宠物不存在');
    const isOwner = pet.publisherId === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, '无权添加回访记录');
    }
    const { content } = req.body;
    if (!content || !content.trim()) throw new ApiError(400, '回访内容不能为空');
    const followup = await adoptionRepository.addFollowup(id, content.trim());
    ok(res, followup);
  } catch (e) {
    next(e);
  }
});

export default router;
