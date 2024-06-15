import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../repositories/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.header('Authorization'));
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized!' });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        (req as any).user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token', error });
    }
};
