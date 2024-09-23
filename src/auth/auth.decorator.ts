import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/types';

import { AuthGuard } from './auth.guard';

export const AllowAuthenticated = (...roles: Role[]) =>
  applyDecorators(SetMetadata('roles', roles), UseGuards(AuthGuard));

export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
