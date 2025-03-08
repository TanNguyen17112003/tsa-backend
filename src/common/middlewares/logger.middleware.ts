import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private static readonly NANOSEC_TO_MILISEC = 1e-6;

  use(req: Request, res: Response, next: NextFunction) {
    const startsAt = process.hrtime.bigint();
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const endsAt = process.hrtime.bigint();
      const responseTime = (
        Number(endsAt - startsAt) * LoggerMiddleware.NANOSEC_TO_MILISEC
      ).toFixed(2);
      const msg = `${method} ${originalUrl} ${statusCode} ${responseTime}ms ${contentLength} - ${userAgent} ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(msg);
      } else if (statusCode >= 400) {
        this.logger.warn(msg);
      } else {
        this.logger.log(msg);
      }
    });

    next();
  }
}
