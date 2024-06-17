import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import { config } from 'dotenv';

const prisma = new PrismaClient();
config();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, firstName, lastName, password, role } = req.body;
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
        role
      }
    });
    if (role.toString() === 'CUSTOMER') {
      await prisma.customer.create({
        data: {
          customerId: newUser.id
        }
      });
    } else if (role.toString() === 'SHIPPER') {
      await prisma.shipper.create({
        data: {
          shipperId: newUser.id
        }
      });
    } else {
      await prisma.staff.create({
        data: {
          staffId: newUser.id
        }
      });
    }
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

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(400).json({ message: 'Cannot find user' });
    }

    await prisma.verificationEmail.deleteMany({
      where: {
        userId
      }
    });
    // Create a new OTP
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    // Create a new data in verificationEmail table for current user
    await prisma.verificationEmail.create({
      data: {
        userId,
        otp
      }
    });
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_GMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
    const mailOptions = {
      from: '"Transport Support Application (TSA) <tsa@no-reply>"',
      to: user.email,
      subject: 'TSA verification link',
      html: `<p>Enter this OTP to verify your tsa account: <div style="font-weight:bold">${otp}</div></p>`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(400).json({ message: 'Failed to send OTP' });
      }
      if (info) {
        console.log(info);
      }
      res.status(200).json({ message: 'OTP sent successfully', otp });
    });
  } catch (error) {
    throw error;
    next();
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  const { otp } = req.body;
  try {
    const verifcationEmail = await prisma.verificationEmail.findFirst({
      select: {
        expiresAt: true
      },
      where: {
        userId,
        otp
      }
    });
    if (!verifcationEmail) {
      return res.status(400).json({ message: 'invalid OTP' });
    }
    if (verifcationEmail.expiresAt.getTime() < Date.now()) {
      await prisma.verificationEmail.delete({
        where: {
          userId
        }
      });
      return res.status(400).json({ message: 'OTP expired' });
    }
    await prisma.verificationEmail.delete({
      where: {
        userId
      }
    });
    await prisma.user.update({
      where: { id: userId },
      data: {
        verified: true
      }
    });
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    throw error;
    next();
  }
};
