import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const isAuthen = await this.authenticateUser(req);
    if (!isAuthen) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }
    const isAuthorized = await this.authorizeUser(req, context);
    if (!isAuthorized) {
      throw new UnauthorizedException('Không có quyền truy cập.');
    }
    return this.authorizeUser(req, context);
  }

  private async authenticateUser(req: Request): Promise<boolean> {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }
    try {
      const user = await this.jwtService.verify(token);
      req['user'] = user;
    } catch (err) {
      return false;
    }
    return true;
  }

  private async authorizeUser(req: any, context: ExecutionContext): Promise<boolean> {
    // const userRoles = await this.getUserRoles(req.user.id);
    // req.user.roles = userRoles;
    const userRole = req.user.role;
    const requiredRoles = this.getMetadata<Role[]>('roles', context);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.some((role) => userRole.includes(role));
  }

  private getMetadata<T>(key: string, context: ExecutionContext): T {
    return this.reflector.getAllAndOverride<T>(key, [context.getHandler(), context.getClass()]);
  }

  // private async getUserRoles(uid: string): Promise<Role[]> {
  //   const roles: Role[] = [];
  //   const [admin, staff, student] = await Promise.all([
  //     this.prisma.admin.findUnique({
  //       where: {
  //         adminId: uid,
  //       },
  //     }),
  //     this.prisma.student.findUnique({
  //       where: {
  //         studentId: uid,
  //       },
  //     }),
  //     this.prisma.staff.findUnique({ where: { staffId: uid } }),
  //   ]);
  //   admin && roles.push('ADMIN');
  //   staff && roles.push('STAFF');
  //   student && roles.push('STUDENT');

  //   return roles;
  // }
}
