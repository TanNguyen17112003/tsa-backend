import { Request, Response, NextFunction } from 'express';
import { authLogger, userLogger } from '../utils/logger';

function authAutoLog(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  res.json = function (body) {
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    authLogger.log(logLevel, 'Response sent', { path: req.path, status: res.statusCode, body });
    return originalJson.call(this, body);
  };

  next();
}

function userAutoLog(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  res.json = function (body) {
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    userLogger.log(logLevel, 'Response sent', { path: req.path, status: res.statusCode, body });
    return originalJson.call(this, body);
  };

  next();
}

export { authAutoLog, userAutoLog };
