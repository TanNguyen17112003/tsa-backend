import { Body, Controller, Get, HttpStatus, Post, Put, Request, Response } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated } from 'src/common/auth/auth.decorator';
import { SignInDto, SignUpDto, UpdatePasswordDto } from 'src/dto/user.dto';
import { UserService } from 'src/services/user.service';

@ApiTags('Authentication')
@Controller('/api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) {}

  @ApiOperation({ summary: 'Sign up' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @Post('/signup')
  async Signup(@Response() response, @Body() user: SignUpDto) {
    try {
      const userInfo = await this.userService.signup(user, this.jwtService);
      return response.status(HttpStatus.CREATED).json({
        userInfo,
      });
    } catch (error) {
      return response.status(error.getStatus()).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  @Post('/signin')
  @ApiOperation({ summary: 'Sign in' })
  @ApiResponse({ status: 200, description: 'OK.' })
  async SignIn(@Response() response, @Body() user: SignInDto) {
    try {
      const token = await this.userService.signin(user, this.jwtService);
      return response.status(HttpStatus.OK).json(token);
    } catch (error) {
      return response.status(error.getStatus()).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  @Put('/update-password')
  @ApiOperation({ summary: 'Update User Password' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @AllowAuthenticated()
  @ApiBearerAuth('JWT-Auth')
  async updatePassword(
    @Response() response,
    @Request() request,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    try {
      await this.userService.updatePassword(request.user, updatePasswordDto);

      return response.status(HttpStatus.OK).json({
        message: 'Cập nhật mật khẩu thành công',
      });
    } catch (error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  @Get('/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @ApiBearerAuth('JWT-Auth')
  @AllowAuthenticated()
  async get(@Response() response, @Request() request) {
    try {
      const user = await this.userService.getById(request.user.id);
      return response.status(HttpStatus.OK).json(user);
    } catch (error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  @Get('/all')
  @ApiOperation({ summary: 'Get all available users using this application' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @AllowAuthenticated('ADMIN')
  @ApiBearerAuth('JWT-Auth')
  async getAllUsers(@Response() response) {
    try {
      const users = await this.userService.getAll();
      return response.status(HttpStatus.OK).json(users);
    } catch (error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}
