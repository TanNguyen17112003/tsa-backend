import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from 'src/email';
import { FirebaseService } from 'src/firebase';
import { NotificationsService } from 'src/notifications';
import { PrismaService } from 'src/prisma';

import { AuthServiceImpl } from './auth.service.impl';

describe('AuthServiceImpl', () => {
  let authService: AuthServiceImpl;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationEmail: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    student: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values = {
        APP_URL: 'http://localhost',
        FRONTEND_URL_COMPLETE_SIGNUP: 'http://localhost/complete',
        MOBILE_URL_COMPLETE_SIGNUP: 'app://complete',
        SALT_ROUNDS: '10',
        JWT_SECRET: 'secret',
      };
      return values[key];
    }),
  };

  const mockFirebaseService = {
    getAuth: jest.fn(() => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'http://test.com/picture.jpg',
      }),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthServiceImpl,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    authService = module.get<AuthServiceImpl>(AuthServiceImpl);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateRegistration', () => {
    it('should send verification email if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce({ id: 'userId' });

      const result = await authService.initiateRegistration('test@example.com', false);

      expect(result).toEqual({ message: 'Verification email sent' });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should resend verification email if user has not been verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'id', verified: false });
      mockPrismaService.verificationEmail.upsert.mockResolvedValueOnce({ id: 'userId' });

      const result = await authService.initiateRegistration('test@example.com', false);

      expect(result).toEqual({ message: 'Verification email sent' });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw if email already registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'id', verified: true });

      await expect(authService.initiateRegistration('test@example.com', false)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyEmail', () => {
    it('should redirect to correct URL for mobile', async () => {
      mockPrismaService.verificationEmail.findFirst.mockResolvedValueOnce({ userId: 'userId' });
      mockJwtService.sign.mockReturnValue('jwtToken');

      const url = await authService.verifyEmail('token', true);

      expect(url).toContain('jwtToken');
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should throw for invalid token', async () => {
      mockPrismaService.verificationEmail.findFirst.mockResolvedValueOnce(null);

      await expect(authService.verifyEmail('invalid', false)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 'userId' });
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ verified: false });
      mockPrismaService.$transaction.mockResolvedValueOnce(null);

      const result = await authService.completeRegistration({
        token: 'token',
        password: 'password',
        firstName: 'First',
        lastName: 'Last',
        phoneNumber: '123456789',
        dormitory: 'A',
        building: 'Building',
        room: 'Room',
      });

      expect(result).toEqual({ message: 'Registration completed successfully' });
    });

    it('should throw if token invalid', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error();
      });

      await expect(
        authService.completeRegistration({
          token: 'bad',
          password: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          dormitory: 'B',
          building: '',
          room: '',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signin', () => {
    it('should sign in successfully on desktop', async () => {
      mockPrismaService.student.findUnique.mockResolvedValueOnce({
        dormitory: 'A',
        building: 'A1',
        room: 'A101',
      });
      mockJwtService.sign.mockReturnValue('token');

      const user = {
        id: 'id',
        email: 'test@example.com',
        password: 'test-password',
        role: 'STUDENT',
      } as any;
      const result = await authService.signin(user, false);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'token',
        userInfo: {
          id: 'id',
          email: 'test@example.com',
          role: 'STUDENT',
          dormitory: 'A',
          building: 'A1',
          room: 'A101',
        },
      });
      expect(notificationsService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should sign in successfully on mobile', async () => {
      mockPrismaService.student.findUnique.mockResolvedValueOnce({
        dormitory: 'A',
        building: 'A1',
        room: 'A101',
      });
      mockJwtService.sign.mockReturnValue('token');

      const user = {
        id: 'id',
        email: 'test@example.com',
        password: 'test-password',
        role: 'STUDENT',
      } as any;
      const result = await authService.signin(user, true);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'token',
        userInfo: {
          id: 'id',
          email: 'test@example.com',
          role: 'STUDENT',
          dormitory: 'A',
          building: 'A1',
          room: 'A101',
        },
      });
      expect(notificationsService.sendPushNotification).toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in with Google', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'id',
        email: 'test@example.com',
        password: 'test-password',
        role: 'STUDENT',
      });
      mockPrismaService.student.findUnique.mockResolvedValueOnce({
        dormitory: 'A',
        building: 'A1',
        room: 'A101',
      });
      mockJwtService.sign.mockReturnValue('token');

      const result = await authService.signInWithGoogle({ idToken: 'idToken' }, false);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'token',
        userInfo: {
          id: 'id',
          email: 'test@example.com',
          role: 'STUDENT',
          dormitory: 'A',
          building: 'A1',
          room: 'A101',
        },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh token successfully', async () => {
      mockJwtService.verify.mockReturnValueOnce({ id: 'id', email: '', role: '' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValueOnce({
        expiresAt: new Date(Date.now() + 10000),
      });
      mockJwtService.sign.mockReturnValueOnce('newAccessToken');

      const result = await authService.refreshTokens('refreshToken');

      expect(result).toHaveProperty('accessToken', 'newAccessToken');
    });

    it('should throw if refresh token invalid', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(authService.refreshTokens('bad')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signout', () => {
    it('should signout successfully', async () => {
      mockJwtService.verify = jest.fn().mockReturnValue({ id: 'id' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValueOnce({ token: 'refreshToken' });
      mockPrismaService.refreshToken.delete.mockResolvedValueOnce(null);

      const result = await authService.signout('refreshToken');

      expect(result).toEqual({ message: 'Sign out successful' });
    });

    it('should throw if refresh token invalid', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValueOnce(null);

      await expect(authService.signout('bad')).rejects.toThrow(UnauthorizedException);
    });
  });
});
