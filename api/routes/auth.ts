import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../src/repositories/userRepo.js';
import { petRepository } from '../src/repositories/petRepo.js';
import { favoriteRepository } from '../src/repositories/interactionRepo.js';
import { signToken } from '../src/utils/jwt.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware } from '../src/middlewares/auth.js';
import type { RegisterPayload, LoginPayload, UserRole } from '../../shared/types.js';

const router = Router();

// 注册
router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { username, password, nickname, email, phone, role } = req.body as RegisterPayload;
    if (!username || !password || !nickname || !email) {
      throw new ApiError(400, '用户名、密码、昵称、邮箱均为必填项');
    }
    if (username.length < 3 || username.length > 20) {
      throw new ApiError(400, '用户名长度需为 3-20 个字符');
    }
    if (password.length < 6) {
      throw new ApiError(400, '密码至少 6 位');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ApiError(400, '邮箱格式不正确');
    }
    if (await userRepository.findByUsername(username)) {
      throw new ApiError(400, '用户名已被使用');
    }
    if (await userRepository.findByEmail(email)) {
      throw new ApiError(400, '邮箱已被使用');
    }
    // 普通用户只能注册 user 或 org
    const finalRole: UserRole = role === 'org' ? 'org' : 'user';
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await userRepository.create({
      username, passwordHash, nickname, email, phone, role: finalRole,
      avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`friendly user avatar for ${nickname}, warm soft tones`)}&image_size=square_hd`,
    });
    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    ok(res, { ...user, token });
  } catch (e) {
    next(e);
  }
});

// 登录
router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { username, password } = req.body as LoginPayload;
    if (!username || !password) {
      throw new ApiError(400, '请输入用户名和密码');
    }
    const record = await userRepository.findByUsername(username);
    if (!record) {
      throw new ApiError(400, '用户名或密码错误');
    }
    const { user, passwordHash } = record;
    if (user.status === 'disabled') {
      throw new ApiError(403, '账号已被禁用，请联系管理员');
    }
    if (!bcrypt.compareSync(password, passwordHash)) {
      throw new ApiError(400, '用户名或密码错误');
    }
    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    ok(res, { ...user, token });
  } catch (e) {
    next(e);
  }
});

// 当前用户
router.get('/me', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    if (!user) throw new ApiError(404, '用户不存在');
    ok(res, user);
  } catch (e) {
    next(e);
  }
});

// 更新个人资料
router.put('/me', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const { nickname, email, phone, avatar, bio } = req.body;
    const user = await userRepository.update(req.user!.userId, { nickname, email, phone, avatar, bio });
    if (!user) throw new ApiError(404, '用户不存在');
    ok(res, user);
  } catch (e) {
    next(e);
  }
});

// 我的收藏列表
router.get('/me/favorites', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const petIds = await favoriteRepository.listUserFavorites(req.user!.userId);
    const pets = (await Promise.all(petIds.map(id => petRepository.findById(id)))).filter(Boolean);
    ok(res, pets);
  } catch (e) {
    next(e);
  }
});

export default router;
