import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { SignUpDto, SignUpDtoInit } from './dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate the Sign up process with user (student) email' })
  @ApiResponse({ status: 201, description: 'Request success' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  async initiateRegistration(@Body() body: SignUpDtoInit) {
    return this.authService.initiateRegistration(body.email);
  }

  @Get('signup/verify')
  @ApiOperation({ summary: 'Verify the email from the initial signup process' })
  @ApiResponse({ status: 302, description: 'Redirected' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const redirectUrl = await this.authService.verifyEmail(token);
    res.redirect(redirectUrl);
  }

  @Post('signup/complete')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete the registration process' })
  @ApiResponse({ status: 200, description: 'Registration completed' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  completeRegistration(@Body('token') token: string, @Body('userData') userData: SignUpDto) {
    return this.authService.completeRegistration(token, userData);
  }
}
