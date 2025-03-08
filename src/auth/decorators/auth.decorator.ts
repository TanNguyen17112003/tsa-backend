import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard, RolesGuard } from '../guards';
import { Roles } from './roles.decorator';

export const Auth = (...roles: UserRole[]) => {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('JWT-Auth'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden' })
  );
};
