import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DateService } from 'src/date';
import { EmailService } from 'src/email';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';
import { v4 as uuidv4 } from 'uuid';

import { SignInResultDto, SignUpDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly dateService: DateService
  ) {}

  /**
   * Initiates the registration process by sending a verification email.
   *
   * This belongs to the registration flow of a student with email and password.
   * @param email The email address to send the verification email to
   */
  async initiateRegistration(email: string) {
    const credentialAndUser = await this.prisma.credentials.findUnique({
      where: { email },
      include: {
        user: true,
      },
    });
    if (credentialAndUser && credentialAndUser.user.verified) {
      throw new BadRequestException('Email already registered');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now (UTC)
    if (credentialAndUser) {
      // Update new token and expiration time
      await this.prisma.verificationEmail.upsert({
        where: { userId: credentialAndUser.uid },
        update: {
          token,
          expiresAt,
        },
        create: {
          token,
          expiresAt,
          userId: credentialAndUser.uid,
        },
      });
    } else {
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
              expiresAt,
            },
          },
        },
      });
    }

    const verificationLink = `${process.env.APP_URL}/api/auth/signup/verify?token=${token}`;
    await this.emailService.sendVerificationEmail(email, verificationLink);

    return { message: 'Verification email sent' };
  }

  /**
   * Verifies the email address of a user.
   *
   * This belongs to the registration flow of a student with email and password.
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

    const jwtToken = this.jwtService.sign({ userId: user.userId }, { expiresIn: '1h' });
    return `${process.env.FRONTEND_URL_COMPLETE_SIGNUP}?token=${jwtToken}`;
  }

  /**
   * Completes the registration process by setting the user's password and personal information.
   *
   * This belongs to the registration flow of a student with email and password.
   * @param token The JWT token containing the user ID
   * @param userData The user's password and personal information
   */
  async completeRegistration(userData: SignUpDto) {
    let userId: string;
    try {
      const payload = this.jwtService.verify<{ userId: string }>(userData.token);
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
        verified: true,
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

  async generateTokens(payload: GetUserType) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        userId: payload.id,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<GetUserType>(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logs in a user with email and password using JWT strategy.
   * @param email The email address of the user
   * @param password The password of the user
   */
  async signin(email: string, password: string): Promise<SignInResultDto> {
    const credential = await this.prisma.credentials.findUnique({
      where: { email },
    });
    if (!credential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: credential.uid },
    });
    if (!user.verified) {
      throw new UnauthorizedException('Email not verified');
    }

    const comparison = await bcrypt.compare(password, credential.password);
    if (!comparison) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: GetUserType = {
      email,
      role: user.role,
      id: user.id,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);

    return {
      accessToken,
      refreshToken,
      userInfo: {
        ...user,
        email,
      },
    };
  }

  /**
   * Invalidates the refresh token of a user, effectively logging them out.
   * @param refreshToken The refresh token to invalidate
   */
  async signout(refreshToken: string) {
    try {
      this.jwtService.verify<GetUserType>(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      return { message: 'Sign out successful' };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
