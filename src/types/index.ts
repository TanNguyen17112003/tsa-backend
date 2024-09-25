import { UserRole } from '@prisma/client';

export type Role = 'ADMIN' | 'STAFF' | 'STUDENT'; // Should use UserRole type from Prisma instead, will delete this later
export type GetUserType = {
  id: string;
  role: UserRole;
  email: string;
};
export type RestrictProperties<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : never;
} & Required<U>;
