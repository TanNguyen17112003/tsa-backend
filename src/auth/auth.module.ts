import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FirebaseModule } from 'src/firebase';
import { NotificationsModule } from 'src/notifications';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthServiceImpl } from './auth.service.impl';
import { JwtStrategy, LocalStrategy } from './strategies';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    FirebaseModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: AuthService,
      useClass: AuthServiceImpl,
    },
    LocalStrategy,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
