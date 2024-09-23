import { ForbiddenException } from '@nestjs/common';
import { GetUserType, Role } from 'src/types';

export const checkRowLevelPermission = (
  user: GetUserType,
  requestedUid?: string | string[],
  roles: Role[] = ['ADMIN', 'STAFF', 'STUDENT']
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
