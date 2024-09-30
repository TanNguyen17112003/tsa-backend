import { faker } from '@faker-js/faker';
import { Prisma, ReportStatus, UserRole } from '@prisma/client';
import * as moment from 'moment';

import { chooseRandomEnum, randomDormitory } from './utils';

const NUM_USERS = 5;
const NUM_ORDERS = 10;
export const userSamples: Prisma.UserCreateInput[] = Array.from({ length: NUM_USERS }, () => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phoneNumber: faker.phone.number({ style: 'international' }),
  createdAt: '1726028961',
  role: chooseRandomEnum(UserRole),
}))
  .concat({
    id: faker.string.uuid(),
    firstName: 'Admin',
    lastName: 'Admin',
    phoneNumber: faker.phone.number({ style: 'international' }),
    createdAt: '1726028961',
    role: UserRole.ADMIN,
  })
  .concat({
    id: faker.string.uuid(),
    firstName: 'Staff',
    lastName: 'Staff',
    phoneNumber: faker.phone.number({ style: 'international' }),
    createdAt: '1726028961',
    role: UserRole.STAFF,
  })
  .concat({
    id: faker.string.uuid(),
    firstName: 'Student',
    lastName: 'Student',
    phoneNumber: faker.phone.number({ style: 'international' }),
    createdAt: '1726028961',
    role: UserRole.STUDENT,
  });

export const credentialSamples = (uid: string): Prisma.CredentialsCreateInput => ({
  email: faker.internet.email(),
  password: '12345678',
  user: {
    connect: {
      id: uid,
    },
  },
});

export const orderSamples: Prisma.OrderCreateInput[] = Array.from({ length: NUM_ORDERS }, () => ({
  product: faker.commerce.productName(),
  createdAt: moment().format('X'),
  address: randomDormitory(),
  checkCode: faker.string.alphanumeric(10),
  weight: Number(faker.number.float({ min: 0, max: 10 }).toFixed(2)),
}));

export const reportSamples = (orderId: string): Prisma.ReportCreateInput => ({
  status: chooseRandomEnum(ReportStatus),
  content: faker.lorem.sentence(),
  reportedAt: moment().format('X'),
  proof: faker.internet.url(),
  order: {
    connect: {
      id: orderId,
    },
  },
  student: {
    connect: {
      studentId: faker.string.uuid(),
    },
  },
});
