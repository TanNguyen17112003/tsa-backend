import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';

@Controller('api/users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // @Put('/update-password')
  // @ApiOperation({ summary: 'Update User Password' })
  // @ApiResponse({ status: 200, description: 'OK.' })
  // @AllowAuthenticated()
  // @ApiBearerAuth('JWT-Auth')
  // async updatePassword(@Response() response, @Request() request, @Body() updatePasswordDto) {
  //   try {
  //     await this.userService.updatePassword(request.user, updatePasswordDto);

  //     return response.status(HttpStatus.OK).json({
  //       message: 'Cập nhật mật khẩu thành công',
  //     });
  //   } catch (error) {
  //     return response.status(HttpStatus.BAD_REQUEST).json({
  //       status: 'error',
  //       message: error.message,
  //     });
  //   }
  // }

  // @Get('/profile')
  // @ApiOperation({ summary: 'Get user profile' })
  // @ApiResponse({ status: 200, description: 'OK.' })
  // @ApiBearerAuth('JWT-Auth')
  // @AllowAuthenticated()
  // async get(@Response() response, @Request() request) {
  //   try {
  //     const user = await this.userService.getById(request.user.id);
  //     return response.status(HttpStatus.OK).json(user);
  //   } catch (error) {
  //     return response.status(HttpStatus.BAD_REQUEST).json({
  //       status: 'error',
  //       message: error.message,
  //     });
  //   }
  // }

  // @Get('/all')
  // @ApiOperation({ summary: 'Get all available users using this application' })
  // @ApiResponse({ status: 200, description: 'OK.' })
  // @AllowAuthenticated('ADMIN')
  // @ApiBearerAuth('JWT-Auth')
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
