import { Prisma, PrismaClient, User } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

import { credentialSamples, orderSamples, reportSamples, userSamples } from './data';

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
  return userSamples;
};

const createOrders = async (users: Prisma.UserCreateInput[]) => {
  const admins = users.filter((user) => user.role === 'ADMIN');
  const students = users.filter((user) => user.role === 'STUDENT');

  for (const order of orderSamples) {
    const probability = Math.random();

    const orderData: Prisma.OrderCreateInput = { ...order };

    if (probability > 0.7) {
      orderData.student = {
        connect: {
          studentId: students[Math.floor(Math.random() * students.length)]?.id,
        },
      };
    } else {
      orderData.admin = {
        connect: {
          adminId: admins[Math.floor(Math.random() * admins.length)]?.id,
        },
      };
    }

    const createdOrder = await prisma.order.create({
      data: orderData,
    });

    const status = probability > 0.5 ? 'ACCEPTED' : 'REJECTED';

    await prisma.orderStatusHistory.create({
      data: {
        orderId: createdOrder.id,
        status: status,
        time: new Date().toISOString(),
        reason: status === 'REJECTED' ? 'Đơn hàng thuộc danh mục cấm' : undefined,
      },
    });

    const report = reportSamples(createdOrder.id);
    await prisma.report.create({
      data: {
        ...report,
        student: {
          connect: {
            studentId: students[Math.floor(Math.random() * students.length)]?.id,
          },
        },
        reply: report.status === 'REPLIED' ? 'Báo cáo của bạn đã được xử lý' : undefined,
        admin:
          report.status === 'REPLIED'
            ? { connect: { adminId: admins[Math.floor(Math.random() * admins.length)]?.id } }
            : undefined,
        repliedAt: report.status === 'REPLIED' ? '6969696969' : undefined,
      },
    });
  }
};

async function main() {
  prisma = new PrismaClient();
  try {
    const users = await createUsers();
    await createOrders(users);
  } catch (e) {
    console.error(e);
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
