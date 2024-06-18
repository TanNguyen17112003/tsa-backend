import { Request, Response, NextFunction } from 'express';
import { UserType } from '../types/user';
import jwt from 'jsonwebtoken';
import { prisma } from '../repositories/prisma';
interface ExtendedRequest extends Request {
  user?: UserType;
}
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    (req as ExtendedRequest).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error });
  }
};
