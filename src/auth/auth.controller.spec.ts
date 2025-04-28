import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;

  const mockAuthService = {
    initiateRegistration: jest.fn(),
    verifyEmail: jest.fn(),
    completeRegistration: jest.fn(),
    signin: jest.fn(),
    signInWithGoogle: jest.fn(),
    refreshTokens: jest.fn(),
    signout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateRegistration', () => {
    it('should call service and return result', async () => {
      const body = { email: 'test@example.com' };
      mockAuthService.initiateRegistration.mockResolvedValue({
        message: 'Verification email sent',
      });

      const result = await authController.initiateRegistration(body);

      expect(result).toHaveProperty('message', 'Verification email sent');
      expect(mockAuthService.initiateRegistration).toHaveBeenCalledWith('test@example.com', false);
    });
  });

  describe('verifyEmail', () => {
    it('should redirect to url', async () => {
      const redirect = jest.fn();
      mockAuthService.verifyEmail.mockResolvedValue('http://redirect.url');

      await authController.verifyEmail('token', true, { redirect } as any);

      expect(redirect).toHaveBeenCalledWith('http://redirect.url');
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration', async () => {
      mockAuthService.completeRegistration.mockResolvedValue({ message: 'Completed' });

      const result = await authController.completeRegistration({
        token: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dormitory: 'A',
        building: '',
        room: '',
      });

      expect(result).toEqual({ message: 'Completed' });
    });
  });

  describe('signIn', () => {
    it('should sign in', async () => {
      mockAuthService.signin.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await authController.signIn({} as any);

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in with Google', async () => {
      mockAuthService.signInWithGoogle.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await authController.signInWithGoogle({ idToken: 'idToken' });

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new',
        refreshToken: 'refresh',
      });

      const result = await authController.refreshToken({ refreshToken: 'token' });

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('signOut', () => {
    it('should sign out', async () => {
      mockAuthService.signout.mockResolvedValue({ message: 'Signed out' });

      const result = await authController.signOut({ refreshToken: 'token' });

      expect(result).toEqual({ message: 'Signed out' });
    });
  });
});
