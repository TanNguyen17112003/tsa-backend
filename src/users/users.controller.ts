import { Body, Controller, Delete, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Auth, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { UpdatePasswordDto, UpdateRoleDto, UpdateStudentDto } from './dto';
import { UserEntity } from './entities';
import { UsersService } from './users.service';

@Controller('api/users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @Auth('ADMIN')
  @ApiOperation({ summary: 'Get all available users using this application' })
  @ApiResponse({ status: 200, description: 'OK.', type: [UserEntity] })
  async getAllUsers() {
    return this.usersService.getUsers();
  }

  @Get('/profile')
  @Auth()
  @ApiOperation({ summary: 'Get profile of current logged in user' })
  @ApiResponse({ status: 200, description: 'OK.', type: UserEntity })
  get(@GetUser() user: GetUserType): Promise<UserEntity> {
    return this.usersService.findById(user.id);
  }

  @Patch('/profile')
  @Auth()
  @ApiOperation({ summary: 'Update profile of current logged in student' })
  @ApiResponse({ status: 200, description: 'OK.', type: UserEntity })
  update(@GetUser() user: GetUserType, @Body() updateStudentDto: UpdateStudentDto) {
    return this.usersService.updateStudentById(user.id, updateStudentDto);
  }

  @Put('/password')
  @Auth()
  @ApiOperation({ summary: 'Update User Password' })
  @ApiResponse({ status: 200, description: 'OK.' })
  async updatePassword(@GetUser() user: GetUserType, @Body() updatePasswordDto: UpdatePasswordDto) {
    await this.usersService.updatePassword(user.id, updatePasswordDto);

    return { message: 'Cập nhật mật khẩu thành công' };
  }

  @Put('/role/:id')
  @Auth('ADMIN')
  @ApiOperation({ summary: 'Update User Role' })
  @ApiResponse({ status: 200, description: 'OK.' })
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateUserRole(id, updateRoleDto.role as UserRole);
  }

  @Delete('/:id')
  @Auth('ADMIN')
  @ApiOperation({ summary: 'Delete User' })
  @ApiResponse({ status: 200, description: 'OK.' })
  delete(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
