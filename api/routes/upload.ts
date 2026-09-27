import { Router, type Request, type Response } from 'express';
import { upload } from '../src/utils/upload.js';
import { ok, ApiError } from '../src/middlewares/error.js';
import { authMiddleware } from '../src/middlewares/auth.js';

const router = Router();

router.post('/', authMiddleware, upload.single('file'), (req: Request, res: Response, next) => {
  try {
    if (!req.file) throw new ApiError(400, '请上传图片文件');
    const url = `/uploads/${req.file.filename}`;
    ok(res, { url, filename: req.file.filename });
  } catch (e) {
    next(e);
  }
});

export default router;
