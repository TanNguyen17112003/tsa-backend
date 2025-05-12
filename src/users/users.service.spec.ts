import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Staff, Student, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/cloudinary';
import { PrismaService } from 'src/prisma';

import { UpdateStudentDto } from './dto';
import { UsersService } from './users.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let userService: UsersService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let cloudinaryService: CloudinaryService;
  const mockUsers: User[] = [
    {
      id: '1',
      role: UserRole.STUDENT,
      password: 'hashed',
      email: 'test-user1@example.com',
      firstName: 'Student1',
      lastName: 'Test',
      phoneNumber: '0123456789',
      photoUrl: 'http://example.com/photo1.jpg',
      verified: true,
      createdAt: new Date(),
      status: UserStatus.AVAILABLE,
    },
    {
      id: '2',
      role: UserRole.STAFF,
      password: 'hashed',
      email: 'test-user2@example.com',
      firstName: 'Staff1',
      lastName: 'Test',
      phoneNumber: '0123456788',
      photoUrl: 'http://example.com/photo2.jpg',
      verified: true,
      createdAt: new Date(),
      status: UserStatus.AVAILABLE,
    },
    {
      id: '3',
      role: UserRole.ADMIN,
      password: 'hashed',
      email: 'test-user3@example.com',
      firstName: 'Admin1',
      lastName: 'Test',
      phoneNumber: '0123456787',
      photoUrl: 'http://example.com/photo3.jpg',
      verified: true,
      createdAt: new Date(),
      status: UserStatus.AVAILABLE,
    },
  ];
  const mockStudentInfo: Student = {
    studentId: '1',
    dormitory: 'A',
    building: '1',
    room: '101',
    numberFault: 0,
  };
  const mockStaffInfo: Staff = {
    staffId: '2',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            student: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              create: jest.fn(),
            },
            staff: {
              delete: jest.fn(),
              create: jest.fn(),
            },
            admin: {
              delete: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return a list of users', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          ...mockUsers[0],
          student: mockStudentInfo,
        },
        {
          ...mockUsers[1],
          staff: mockStaffInfo,
        },
        {
          ...mockUsers[2],
        },
      ]);

      const result = await userService.getUsers();
      expect(result).toEqual([
        {
          ...mockUsers[0],
          student: mockStudentInfo,
          dormitory: mockStudentInfo.dormitory,
          building: mockStudentInfo.building,
          room: mockStudentInfo.room,
        },
        {
          ...mockUsers[1],
          staff: mockStaffInfo,
        },
        {
          ...mockUsers[2],
        },
      ]);
    });

    it('should return empty list', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await userService.getUsers();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a student without password', async () => {
      const mockUser: User = {
        id: '1',
        role: UserRole.STUDENT,
        password: 'hashed',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        photoUrl: 'http://example.com/photo.jpg',
        verified: true,
        createdAt: new Date(),
        status: UserStatus.AVAILABLE,
      };
      const mockStudent = { dormitory: 'A', building: '1', room: '101' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (prismaService.student.findUnique as jest.Mock).mockResolvedValueOnce(mockStudent);

      const result = await userService.findById('1');

      expect(result).toEqual({
        ...mockUser,
        ...mockStudent,
        password: undefined,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prismaService.student.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.student.findUnique).toHaveBeenCalledWith({ where: { studentId: '1' } });
    });

    it('should return a staff without password', async () => {
      const mockUser: User = {
        id: '1',
        role: UserRole.STAFF,
        password: 'hashed',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        photoUrl: 'http://example.com/photo.jpg',
        verified: true,
        createdAt: new Date(),
        status: UserStatus.AVAILABLE,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await userService.findById('1');

      expect(result).toEqual({
        ...mockUser,
        password: undefined,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prismaService.student.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(userService.findById('non-existing')).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.student.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('updateStudentById', () => {
    const mockUser = {
      ...mockUsers[0],
      student: {
        ...mockStudentInfo,
      },
    };
    const userId = mockUser.id;
    const updateData: UpdateStudentDto = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '123456789',
      photoUrl: 'http://example.com/new-photo.jpg',
      dormitory: 'B',
      building: 'B2',
      room: '101',
    };

    it('should update user and student without avatar upload', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUser.id });
      (prismaService.user.update as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        ...updateData,
      });
      (prismaService.student.update as jest.Mock).mockResolvedValueOnce({
        dormitory: 'B',
        building: 'B2',
        room: '101',
      });

      const result = await userService.updateStudentById(userId, updateData);

      expect(result).toEqual({
        ...mockUser,
        ...updateData,
      });
      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      expect(prismaService.student.update).toHaveBeenCalledTimes(1);
      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
    });

    it('should update user and student with avatar upload', async () => {
      const avatarFile = {
        buffer: Buffer.from('dummy image'),
      } as Express.Multer.File;

      const uploadedImageUrl = 'https://cloudinary.com/dummy.jpg';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUser.id });
      (cloudinaryService.uploadImage as jest.Mock).mockResolvedValueOnce({
        secure_url: uploadedImageUrl,
      });
      (prismaService.user.update as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        ...updateData,
        photoUrl: uploadedImageUrl,
      });
      (prismaService.student.update as jest.Mock).mockResolvedValueOnce({
        dormitory: 'B',
        building: 'B2',
        room: '101',
      });

      const result = await userService.updateStudentById(userId, updateData, avatarFile);

      expect(result).toEqual({
        ...mockUser,
        ...updateData,
        photoUrl: uploadedImageUrl,
      });
      expect(cloudinaryService.uploadImage).toHaveBeenCalledTimes(1);
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(avatarFile.buffer);
      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      expect(prismaService.student.update).toHaveBeenCalledTimes(1);
    });

    it('should update user if user is not a student', async () => {
      const mockUser = mockUsers[1];

      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUser.id });
      (prismaService.user.update as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await userService.updateStudentById(userId, updateData);

      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.student.update).not.toHaveBeenCalled();

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.update as jest.Mock).mockResolvedValueOnce(null);

      await expect(userService.updateStudentById('non-existing', updateData)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updatePassword', () => {
    it('should update the user password if current password is correct', async () => {
      const userId = mockUsers[0].id;
      const updatePasswordDto = {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (configService.get as jest.Mock).mockReturnValue('10');
      (prismaService.user.update as jest.Mock).mockResolvedValue({});

      await userService.updatePassword(userId, updatePasswordDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'newHashedPassword' },
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updatePassword('non-existing', { currentPassword: '123', newPassword: '456' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.updatePassword('1', { currentPassword: 'wrong', newPassword: 'newPass' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUserRole', () => {
    it('should throw BadRequestException if user does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUserRole('non-existing-id', UserRole.STAFF)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should elevate a student to staff', async () => {
      const mockUser = {
        ...mockUsers[0],
        student: {
          ...mockStudentInfo,
        },
      };
      const updatedUser = {
        ...mockUsers[0],
        role: UserRole.STAFF,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.student.delete as jest.Mock).mockResolvedValue({});
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prismaService.staff.create as jest.Mock).mockResolvedValue({});

      const result = await userService.updateUserRole(mockUser.id, UserRole.STAFF);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { student: true, staff: true, admin: true },
      });

      expect(prismaService.student.delete).toHaveBeenCalledTimes(1);

      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { role: UserRole.STAFF },
      });

      expect(prismaService.staff.create).toHaveBeenCalledTimes(1);

      expect(result).toEqual(updatedUser);
    });

    it('should elevate a staff to admin', async () => {
      const mockUser = {
        ...mockUsers[1],
        staff: {
          ...mockStaffInfo,
        },
      };
      const updatedUser = {
        ...mockUsers[1],
        role: UserRole.ADMIN,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.staff.delete as jest.Mock).mockResolvedValue({});
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prismaService.admin.create as jest.Mock).mockResolvedValue({});

      const result = await userService.updateUserRole(mockUser.id, UserRole.ADMIN);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { student: true, staff: true, admin: true },
      });

      expect(prismaService.staff.delete).toHaveBeenCalledTimes(1);

      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { role: UserRole.ADMIN },
      });

      expect(prismaService.admin.create).toHaveBeenCalledTimes(1);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and return success message', async () => {
      (prismaService.user.delete as jest.Mock).mockResolvedValue({});

      const result = await userService.deleteUser('user-id');

      expect(prismaService.user.delete).toHaveBeenCalledTimes(1);
      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id: 'user-id' } });
      expect(result).toEqual({ message: 'User deleted successfully' });
    });
  });
});
