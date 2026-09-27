import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[error]', err);
  if (err instanceof ApiError) {
    res.status(err.code >= 100 && err.code < 600 ? err.code : 400).json({
      code: err.code,
      message: err.message,
      data: null,
    });
    return;
  }
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
  });
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  });
}

// 统一响应包装
export function ok<T>(res: Response, data: T, message = 'ok'): void {
  res.json({ code: 0, message, data });
}

export function fail(res: Response, code: number, message: string): void {
  res.status(code >= 100 && code < 600 ? code : 400).json({
    code,
    message,
    data: null,
  });
}
