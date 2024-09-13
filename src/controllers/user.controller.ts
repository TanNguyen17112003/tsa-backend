import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/auth/auth.guard';
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

  @UseGuards(AuthGuard)
  @Put('/update-password')
  @ApiOperation({ summary: 'Update User Password' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(AuthGuard)
  @Get('/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @ApiBearerAuth('JWT-auth')
  async get(@Response() response, @Request() request) {
    return response.status(HttpStatus.OK).json(request.user);
  }

  @UseGuards(AuthGuard)
  @Get('/all')
  @ApiOperation({ summary: 'Get all available users using this application' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @ApiBearerAuth('JWT-auth')
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
