import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuthGuard } from './auth.guard';

export const AllowAuthenticated = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata('roles', roles), UseGuards(AuthGuard));

export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
