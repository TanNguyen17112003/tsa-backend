import { Prisma, PrismaClient, User } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

import { credentialSamples, userSamples } from './data';

let prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
const createRoles = async (user: User) => {
  switch (user.role) {
    case 'ADMIN':
      await prisma.admin.create({
        data: {
          adminId: user.id,
        },
      });
      break;
    case 'STUDENT':
      await prisma.student.create({
        data: {
          studentId: user.id,
        },
      });
      break;
    case 'STAFF':
      await prisma.staff.create({
        data: {
          staffId: user.id,
        },
      });
      break;
  }
};
const createUsers = async () => {
  for (const user of userSamples) {
    const newUser = await prisma.user.create({
      data: user,
    });
    await Promise.all([
      prisma.credentials.create({
        data: credentialSamples(newUser.id),
      }),
      createRoles(newUser),
    ]);
  }
};

async function main() {
  prisma = new PrismaClient();
  await createUsers();
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
