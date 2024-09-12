import { faker } from '@faker-js/faker';
import { Prisma, UserRole } from '@prisma/client';

import { chooseRandomEnum } from './utils';

const NUM_USERS = 5;
export const userSamples: Prisma.UserCreateInput[] = Array.from({ length: NUM_USERS }, () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phoneNumber: faker.phone.number({ style: 'international' }),
  createdAt: '1726028961',
  role: chooseRandomEnum(UserRole),
}));

export const credentialSamples = (uid: string): Prisma.CredentialsCreateInput => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  user: {
    connect: {
      id: uid,
    },
  },
});
