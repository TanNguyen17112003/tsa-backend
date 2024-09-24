import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated, GetUser } from 'src/auth/auth.decorator';
import { GetUserType } from 'src/types';

import { UpdatePasswordDto, UpdateStudentDto } from './dto';
import { StudentEntity } from './entities';
import { UsersService } from './users.service';

// These APIs are currently for students only
// Will be updated to support staff (and admin) in the future
@Controller('api/users')
@ApiTags('Users')
@ApiBearerAuth('JWT-Auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/profile')
  @ApiOperation({ summary: 'Get profile of current logged in user' })
  @ApiResponse({ status: 200, description: 'OK.', type: StudentEntity })
  @AllowAuthenticated()
  async get(@GetUser() user: GetUserType) {
    return this.usersService.findStudentById(user.id);
  }

  @Patch('/profile')
  @ApiOperation({ summary: 'Update profile of current logged in student' })
  @ApiResponse({ status: 200, description: 'OK.', type: StudentEntity })
  @AllowAuthenticated()
  async update(@GetUser() user: GetUserType, @Body() updateStudentDto: UpdateStudentDto) {
    return this.usersService.updateStudentById(user.id, updateStudentDto);
  }

  @Put('/password')
  @ApiOperation({ summary: 'Update User Password' })
  @ApiResponse({ status: 200, description: 'OK.' })
  @AllowAuthenticated()
  async updatePassword(@GetUser() user: GetUserType, @Body() updatePasswordDto: UpdatePasswordDto) {
    await this.usersService.updatePassword(user.id, updatePasswordDto);

    return { message: 'Cập nhật mật khẩu thành công' };
  }

  // @Get('/all')
  // @ApiOperation({ summary: 'Get all available users using this application' })
  // @ApiResponse({ status: 200, description: 'OK.' })
  // @AllowAuthenticated('ADMIN')
  // async getAllUsers(@Response() response) {
  //   try {
  //     const users = await this.userService.getAll();
  //     return response.status(HttpStatus.OK).json(users);
  //   } catch (error) {
  //     return response.status(HttpStatus.BAD_REQUEST).json({
  //       status: 'error',
  //       message: error.message,
  //     });
  //   }
  // }
}
