import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Response } from 'express';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';

import { AuthService } from './auth.service';
import { GetUser } from './decorators';
import {
  GoogleSignInDto,
  RefreshTokenDto,
  RefreshTokenResultDto,
  SignInDto,
  SignInResultDto,
  SignUpDto,
  SignUpInitDto,
} from './dto';
import { LocalAuthGuard } from './guards';

@Controller('api/auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate the Sign up process with user (student) email' })
  @ApiQuery({ name: 'mobile', required: false })
  @ApiResponse({ status: 201, description: 'Request success', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  initiateRegistration(@Body() body: SignUpInitDto, @Query('mobile') mobile: boolean = false) {
    return this.authService.initiateRegistration(body.email, mobile);
  }

  @Get('signup/verify')
  @ApiOperation({ summary: 'Verify the email from the initial signup process' })
  @ApiQuery({ name: 'mobile', required: false })
  @ApiResponse({ status: 302, description: 'Redirected' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(
    @Query('token') token: string,
    @Query('mobile') mobile: boolean = false,
    @Res() res: Response
  ) {
    const redirectUrl = await this.authService.verifyEmail(token, mobile);
    res.redirect(redirectUrl);
  }

  @Post('signup/complete')
  @ApiOperation({ summary: 'Complete the registration process' })
  @ApiResponse({ status: 200, description: 'Registration completed', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  completeRegistration(@Body() dto: SignUpDto) {
    return this.authService.completeRegistration(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: SignInDto })
  @ApiQuery({ name: 'mobile', required: false })
  @ApiResponse({ status: 200, description: 'OK', type: SignInResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  signIn(@GetUser() user: User, @Query('mobile') mobile: boolean = true) {
    return this.authService.signin(user, mobile);
  }

  @Post('signin/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiQuery({ name: 'mobile', required: false })
  @ApiResponse({ status: 200, description: 'OK', type: SignInResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  signInWithGoogle(@Body() dto: GoogleSignInDto, @Query('mobile') mobile: boolean = true) {
    return this.authService.signInWithGoogle(dto, mobile);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New tokens generated', type: RefreshTokenResultDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResultDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out' })
  @ApiResponse({ status: 200, description: 'Sign out success', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  signOut(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.signout(refreshTokenDto.refreshToken);
  }
}
