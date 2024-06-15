import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, firstName, lastName, password, role, status } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        status
      }
    });
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.log(error);
    next();
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    next();
  }
};

export const changeInformation = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName })
      }
    });
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.log(error);
    next();
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('chovy');
      return res.status(400).json({ message: 'Invalid password' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.log(error);
    next();
  }
};
