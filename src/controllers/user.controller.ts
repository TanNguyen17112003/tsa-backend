import { UserType } from '../types/user';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createUser(body: UserType) {
    try {
        const newUser = await prisma.user.create({
            data: body
        });
        return {
            success: true,
            data: newUser
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

export { createUser };
