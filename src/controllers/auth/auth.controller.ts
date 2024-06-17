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
  const { email, firstName, lastName, password, role, verificationEmail } = req.body;
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
        verificationEmail
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
  const { email } = req.body;
  try {
    console.log({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_GMAIL,
      pass: process.env.SMTP_PASSWORD
    });
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
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
      to: email,
      subject: 'TSA verification link',
      html: `<p>Enter this OTP to verify your tsa account: ${otp}</p>`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(400).json({ message: 'Failed to send OTP' });
      }
      if (info) {
        console.log(info);
      }
      res.status(200).json({ message: 'OTP sent successfully', otp });
    });
  } catch (error) {
    console.log(error);
    next();
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (otp !== process.env.OTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.log(error);
    next();
  }
};
