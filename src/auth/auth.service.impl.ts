import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';
import { EmailService } from 'src/email';
import { FirebaseService } from 'src/firebase';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';
import { v4 as uuidv4 } from 'uuid';

import { AuthService } from './auth.service';
import { GoogleSignInDto, SignInResultDto, SignUpDto } from './dto';

@Injectable()
export class AuthServiceImpl extends AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService
  ) {
    super();
  }

  /**
   * Initiates the registration process by sending a verification email.
   *
   * This belongs to the registration flow of a student with email and password.
   * @param email The email address to send the verification email to
   * @param mobile Whether the request is from a mobile device
   */
  override async initiateRegistration(email: string, mobile: boolean): Promise<MessageResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user && user.verified) {
      throw new BadRequestException('Email already registered');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now (UTC)
    if (user) {
      // Update new token and expiration time
      await this.prisma.verificationEmail.upsert({
        where: { userId: user.id },
        update: {
          token,
          expiresAt,
        },
        create: {
          token,
          expiresAt,
          userId: user.id,
        },
      });
    } else {
      await this.prisma.user.create({
        data: {
          email,
          student: {
            create: {},
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

    const verificationLink = `${this.configService.get<string>('APP_URL')}/api/auth/signup/verify?token=${token}&mobile=${mobile}`;
    await this.emailService.sendVerificationEmail(email, verificationLink);

    return { message: 'Verification email sent' };
  }

  /**
   * Verifies the email address of a user.
   *
   * This belongs to the registration flow of a student with email and password.
   * @param token The verification token
   * @param mobile Whether the request is from a mobile device
   * @returns The URL to redirect the user to
   */
  override async verifyEmail(token: string, mobile: boolean) {
    const verificationEmail = await this.prisma.verificationEmail.findFirst({
      where: { token: token, expiresAt: { gt: new Date() } },
    });

    if (!verificationEmail) {
      throw new BadRequestException('Invalid or expired token');
    }

    const jwtToken = this.jwtService.sign({ userId: verificationEmail.userId });

    if (mobile) {
      return `${this.configService.get<string>('MOBILE_URL_COMPLETE_SIGNUP')}/${jwtToken}`;
    }
    return `${this.configService.get<string>('FRONTEND_URL_COMPLETE_SIGNUP')}?token=${jwtToken}`;
  }

  /**
   * Completes the registration process by setting the user's password and personal information.
   *
   * This belongs to the registration flow of a student with email and password.
   * @param dto The user's password and personal information, as well as a JWT token containing the user ID
   */
  override async completeRegistration(dto: SignUpDto): Promise<MessageResponseDto> {
    let userId: string;
    try {
      const payload = this.jwtService.verify<{ userId: string }>(dto.token);
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

    const hashedPassword = await bcrypt.hash(
      dto.password,
      Number(this.configService.get('SALT_ROUNDS'))
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber,
          password: hashedPassword,
          verified: true,
        },
      }),
      this.prisma.student.update({
        where: { studentId: userId },
        data: {
          dormitory: dto.dormitory,
          building: dto.building,
          room: dto.room,
        },
      }),
      this.prisma.verificationEmail.delete({
        where: { userId: userId },
      }),
    ]);

    return { message: 'Registration completed successfully' };
  }

  /**
   * Validates a user's email and password.
   * Used in Passport local strategy
   * @param email The email address of the user
   * @param password The password of the user
   */
  override async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      this.logger.error(`User not found with email: ${email}`);
      this.throwInvalidEmailOrPassword();
    }
    if (!user.verified) {
      this.logger.error(`User not verified with email: ${email}`);
      this.throwInvalidEmailOrPassword();
    }
    if (user.status === UserStatus.DEACTIVATED) {
      this.logger.error(`User is banned or deactivated with email: ${email}`);
      this.throwInvalidEmailOrPassword();
    }
    if (!(await bcrypt.compare(password, user.password))) {
      this.logger.error(`Invalid password for user with email: ${email}`);
      this.throwInvalidEmailOrPassword();
    }
    return user;
  }

  /**
   * Validates a user's JWT token.
   * Used in Passport JWT strategy
   * @param jwtPayload The payload of the JWT token
   * @returns The user associated with the JWT token
   * @throws `UnauthorizedException` if the user is not found or is banned/deactivated
   */
  override async validateUserForJwt(jwtPayload: GetUserType): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: jwtPayload.id },
    });
    if (!user) {
      this.logger.error(`User not found with ID: ${jwtPayload.id}`);
      throw new UnauthorizedException('Invalid token');
    }
    if (user.status === UserStatus.DEACTIVATED) {
      this.logger.error(`User is banned or deactivated with ID: ${jwtPayload.id}`);
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }

  /**
   * Logs in a user and generates access and refresh tokens.
   * Used after passing the local strategy.
   * @param user The user to log in
   */
  override async signin(user: User, mobile: boolean): Promise<SignInResultDto> {
    let studentAdditionalInfo = null;
    if (user.role === 'STUDENT') {
      const studentInfo = await this.prisma.student.findUnique({
        where: { studentId: user.id },
      });
      studentAdditionalInfo = {
        dormitory: studentInfo.dormitory,
        building: studentInfo.building,
        room: studentInfo.room,
      };
    }
    const payload: GetUserType = {
      email: user.email,
      role: user.role,
      id: user.id,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);
    if (mobile) {
      await this.notificationsService.sendPushNotification(user.id, {
        title: 'Chào mừng bạn đến với TSA',
        message:
          'Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. Chúc bạn một ngày tốt lành!',
      });
    }

    const { password, ...userInfo } = user;
    return {
      accessToken,
      refreshToken,
      userInfo: {
        ...userInfo,
        ...studentAdditionalInfo,
      },
    };
  }

  /**
   * Logs in a user using Google OAuth and generates access and refresh tokens.
   * @param dto The Google sign-in DTO containing the ID token
   * @returns The access and refresh tokens, as well as the user information
   */
  override async signInWithGoogle(dto: GoogleSignInDto, mobile: boolean): Promise<SignInResultDto> {
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await this.firebaseService.getAuth().verifyIdToken(dto.idToken);
    } catch (error) {
      this.logger.error('Error verifying Google ID token:', error);
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const { email, name, picture } = decodedToken;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          photoUrl: picture,
          verified: true,
          AuthProvider: {
            create: {
              type: 'GOOGLE',
            },
          },
          student: {
            create: {},
          },
        },
      });
    }

    if (!user.photoUrl) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          photoUrl: picture,
        },
      });
    }

    let studentAdditionalInfo = null;
    if (user.role === 'STUDENT') {
      const studentInfo = await this.prisma.student.findUnique({
        where: { studentId: user.id },
      });
      studentAdditionalInfo = {
        dormitory: studentInfo.dormitory,
        building: studentInfo.building,
        room: studentInfo.room,
      };
    }

    const payload: GetUserType = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    const { accessToken, refreshToken } = await this.generateTokens(payload);
    if (mobile) {
      await this.notificationsService.sendPushNotification(user.id, {
        title: 'Chào mừng bạn đến với TSA',
        message:
          'Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. Chúc bạn một ngày tốt lành!',
      });
    }

    const { password, ...userInfo } = user;
    return {
      accessToken,
      refreshToken,
      userInfo: {
        ...userInfo,
        ...studentAdditionalInfo,
      },
    };
  }

  /**
   * Refreshes the access token of a user using their refresh token.
   * @param refreshToken The refresh token to use
   * @returns The new access and refresh tokens
   */
  override async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<GetUserType>(refreshToken); // also contains iat and exp
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: GetUserType = {
        email: payload.email,
        role: payload.role,
        id: payload.id,
      };
      const accessToken = this.jwtService.sign(newPayload);
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error('Error refreshing tokens:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Invalidates the refresh token of a user, effectively logging them out.
   * @param refreshToken The refresh token to invalidate
   */
  override async signout(refreshToken: string): Promise<MessageResponseDto> {
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

  private async generateTokens(payload: GetUserType) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        userId: payload.id,
      },
    });

    return { accessToken, refreshToken };
  }

  private throwInvalidEmailOrPassword() {
    throw new UnauthorizedException('Invalid email or password');
  }
}
