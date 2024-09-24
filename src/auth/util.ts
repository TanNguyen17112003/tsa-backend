import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { GetUserType } from 'src/types';

export const checkRowLevelPermission = (
  user: GetUserType,
  requestedUid?: string | string[],
  roles: UserRole[] = ['ADMIN', 'STAFF', 'STUDENT']
) => {
  if (!requestedUid) return false;

  if (roles.includes(user.role)) {
    return true;
  }

  const uids = typeof requestedUid === 'string' ? [requestedUid] : requestedUid.filter(Boolean);

  if (!uids.includes(user.id)) {
    throw new ForbiddenException();
  }
};
