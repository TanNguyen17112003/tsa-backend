import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DateService } from 'src/date';
import { EmailService } from 'src/email';
import { PrismaService } from 'src/prisma';
import { v4 as uuidv4 } from 'uuid';

import { SignUpDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private dateService: DateService
  ) {}

  /**
   * Initiates the registration process by sending a verification email
   * @param email The email address to send the verification email to
   */
  async initiateRegistration(email: string) {
    const credentialAndUser = await this.prisma.credentials.findUnique({
      where: { email },
    });
    if (credentialAndUser) {
      throw new BadRequestException('Email already registered');
    }

    const token = uuidv4();
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour from now (UTC)

    const createdAt = this.dateService.getCurrentUnixTimestamp().toString();
    await this.prisma.user.create({
      data: {
        createdAt,
        student: {
          create: {},
        },
        Credentials: {
          create: {
            email,
          },
        },
        verificationEmail: {
          create: {
            token,
            expiresAt: tokenExpires,
          },
        },
      },
    });

    const verificationLink = `${process.env.APP_URL}/auth/signup/verify?token=${token}`;
    await this.emailService.sendVerificationEmail(email, verificationLink);

    return { message: 'Verification email sent' };
  }

  /**
   * Verifies the email address of a user
   * @param token The verification token
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.verificationEmail.findFirst({
      where: { token: token, expiresAt: { gt: new Date() } },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.verificationEmail.delete({
      where: { userId: user.userId },
    });
    // await this.prisma.user.update({
    //   where: { id: user.userId },
    //   data: {
    //     verified: true,
    //   },
    // });

    const jwtToken = this.jwtService.sign({ userId: user.userId });
    return `${process.env.FRONTEND_URL_COMPLETE_SIGNUP}?token=${jwtToken}`;
  }

  /**
   * Completes the registration process by setting the user's password and personal information
   * @param token The JWT token containing the user ID
   * @param userData The user's password and personal information
   */
  async completeRegistration(token: string, userData: SignUpDto) {
    let userId: string;

    try {
      const payload = this.jwtService.verify<{ userId: string }>(token);
      userId = payload.userId;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.verified) {
      throw new BadRequestException('User not found or already verified');
    }

    const hashedPassword = await bcrypt.hash(userData.password, Number(process.env.SALT_ROUNDS));

    // Not sure if it is safe to use Promise.all here
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
      },
    });
    await this.prisma.student.update({
      where: { studentId: userId },
      data: {
        dormitory: userData.dormitory,
        building: userData.building,
        room: userData.room,
      },
    });
    await this.prisma.credentials.update({
      where: { uid: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Registration completed successfully' };
  }
}
