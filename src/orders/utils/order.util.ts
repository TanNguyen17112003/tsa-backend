import { UnauthorizedException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUserType } from 'src/types';

export const findExistingOrder = async (
  prisma: PrismaService,
  checkCode: string,
  brand: string
) => {
  return await prisma.order.findFirst({
    where: { checkCode, brand },
  });
};

export const createOrderStatusHistory = async (
  prisma: PrismaService,
  orderId: string,
  status: $Enums.OrderStatus,
  reason?: string
) => {
  await prisma.$transaction([
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        time: Math.floor(Date.now() / 1000).toString(),
        reason,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        latestStatus: status,
      },
    }),
  ]);
};

export const validateUserForOrder = (
  user: GetUserType,
  order: any,
  role: 'STUDENT' | 'ADMIN' | 'STAFF'
) => {
  if (role === 'STUDENT' && user.role !== 'STUDENT') {
    throw new UnauthorizedException();
  }
};

export const getLatestOrderStatus = async (prisma: PrismaService, orderId: string) => {
  const latestStatus = await prisma.orderStatusHistory.findFirst({
    where: { orderId },
    orderBy: { time: 'desc' },
  });

  return latestStatus ? latestStatus.status : null;
};

export const getHistoryTimee = async (prisma: PrismaService, orderId: string) => {
  const historyTime = await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { time: 'desc' },
  });
  return historyTime ? historyTime : null;
};

export const convertToUnixTimestamp = (dateString: string): string => {
  return Math.floor(new Date(dateString).getTime() / 1000).toString();
};

export const shippingFeeList = {
  weight: [
    {
      value: '<1',
      fee: 5000,
    },
    {
      value: '1-3',
      fee: 8000,
    },
    {
      value: '>3',
      fee: 12000,
    },
  ],
  floor: [
    {
      value: '<4',
      fee: 0,
    },
    {
      value: '4-6',
      fee: 1000,
    },
    {
      value: '>6',
      fee: 2000,
    },
  ],
  building: {
    A: [
      {
        value: ['A4', 'A7', 'A8', 'A9'],
        fee: 0,
      },
      {
        value: [
          'A1',
          'A2',
          'A3',
          'A5',
          'A6',
          'A10',
          'A11',
          'A12',
          'A13',
          'A14',
          'A15',
          'A16',
          'A17',
          'A18',
          'A19',
          'A20',
        ],
        fee: 2000,
      },
      {
        value: ['AH1', 'AH2', 'AG3', 'AG4'],
        fee: 4000,
      },
    ],
    B: [
      {
        value: ['BD2', 'BD3', 'BD4', 'BD5', 'BD6'],
        fee: 0,
      },
      {
        value: ['BC1', 'BC2', 'BC3', 'BC4', 'BC5', 'BC6', 'BE1', 'BE2', 'BE3', 'BE4'],
        fee: 2000,
      },
      {
        value: ['BA1', 'BA2', 'BA3', 'BA4', 'BA5', 'BB1', 'BB2', 'BB3', 'BB4', 'BB5'],
        fee: 4000,
      },
    ],
  },
};

export const getShippingFee = (
  room: string,
  building: string,
  dormitory: string,
  weight: number
) => {
  let fee = 0;
  if (weight < 1) {
    fee += shippingFeeList.weight[0].fee;
  } else if (weight >= 1 && weight <= 3) {
    fee += shippingFeeList.weight[1].fee;
  } else {
    fee += shippingFeeList.weight[2].fee;
  }
  // Filter for floor based on first character of room
  const floor = room?.length > 0 ? parseInt(room[0]) : 0;
  if (floor < 4) {
    fee += shippingFeeList.floor[0].fee;
  } else if (floor >= 4 && floor <= 6) {
    fee += shippingFeeList.floor[1].fee;
  } else {
    fee += shippingFeeList.floor[2].fee;
  }
  // Filter for building and dormitory
  if (dormitory === 'A') {
    shippingFeeList.building.A.forEach((element) => {
      if (element.value.includes(building)) {
        fee += element.fee;
      }
    });
  } else {
    shippingFeeList.building.B.forEach((element) => {
      if (element.value.includes(building)) {
        fee += element.fee;
      }
    });
  }
  return fee > 15000 ? 15000 : fee;
};

export const shortenUUID = (uuid: string, type: 'ORDER' | 'DELIVERY') => {
  return `#${type === 'ORDER' ? 'TSA' : 'DELI'}${uuid.slice(uuid.length - 6, uuid.length).toUpperCase()}`;
};
