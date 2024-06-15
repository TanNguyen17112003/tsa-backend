import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL connected');
    } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error);
        process.exit(1);
    }
};
