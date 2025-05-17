import { User } from '@prisma/client';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';

import { GoogleSignInDto, SignInResultDto, SignUpDto } from './dto';

export abstract class AuthService {
  abstract initiateRegistration(email: string, mobile: boolean): Promise<MessageResponseDto>;
  abstract verifyEmail(token: string, mobile: boolean): Promise<string>;
  abstract completeRegistration(dto: SignUpDto): Promise<MessageResponseDto>;
  abstract validateUser(email: string, password: string): Promise<User>;
  abstract signin(user: User, mobile: boolean): Promise<SignInResultDto>;
  abstract signInWithGoogle(dto: GoogleSignInDto, mobile: boolean): Promise<SignInResultDto>;
  abstract refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  abstract signout(refreshToken: string): Promise<MessageResponseDto>;
}
