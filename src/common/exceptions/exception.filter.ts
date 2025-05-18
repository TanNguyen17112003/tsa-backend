import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error(exception);
    super.catch(exception, host);
  }
}
