import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { UpdatePasswordDto, UpdateRoleDto, UpdateStudentDto } from './dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let usersController: UsersController;
  const mockUser = {
    id: '1',
    role: UserRole.ADMIN,
    email: 'test-email@example.com',
  };

  const mockUsersService = {
    getUsers: jest.fn(),
    findById: jest.fn(),
    updateStudentById: jest.fn(),
    updatePassword: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: '1' }, { id: '2' }];
      mockUsersService.getUsers.mockResolvedValue(mockUsers);

      const result = await usersController.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUsersService.getUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return user profile', async () => {
      const mockProfile = { id: '1', firstName: 'John' };
      mockUsersService.findById.mockResolvedValue(mockProfile);

      const result = await usersController.get(mockUser);

      expect(result).toEqual(mockProfile);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update student profile without avatar', async () => {
      const updateDto: UpdateStudentDto = { firstName: 'John', lastName: 'Doe' };
      const updatedUser = { id: '1', ...updateDto };
      mockUsersService.updateStudentById.mockResolvedValue(updatedUser);

      const result = await usersController.update(updateDto, mockUser);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateStudentById).toHaveBeenCalledWith('1', updateDto, undefined);
    });

    it('should update student profile with avatar', async () => {
      const updateDto: UpdateStudentDto = { firstName: 'John', lastName: 'Doe' };
      const mockAvatar = { buffer: Buffer.from('fake-image') } as Express.Multer.File;
      const updatedUser = { id: '1', ...updateDto, photoUrl: 'new-photo-url' };
      mockUsersService.updateStudentById.mockResolvedValue(updatedUser);

      const result = await usersController.update(updateDto, mockUser, mockAvatar);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateStudentById).toHaveBeenCalledWith('1', updateDto, mockAvatar);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const updatePasswordDto: UpdatePasswordDto = { currentPassword: 'old', newPassword: 'new' };
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await usersController.updatePassword(mockUser, updatePasswordDto);

      expect(result).toEqual({ message: 'Cập nhật mật khẩu thành công' });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('1', updatePasswordDto);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const mockUpdatedUser = { id: '1', role: UserRole.STAFF };
      const updateRoleDto: UpdateRoleDto = { role: UserRole.STAFF };
      mockUsersService.updateUserRole.mockResolvedValue(mockUpdatedUser);

      const result = await usersController.updateRole('1', updateRoleDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUsersService.updateUserRole).toHaveBeenCalledWith('1', UserRole.STAFF);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockUsersService.deleteUser.mockResolvedValue({ message: 'User deleted successfully' });

      const result = await usersController.delete('1');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
