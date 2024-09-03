import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from 'src/controllers/app.controller';
import { SampleController } from 'src/controllers/sample.controller';
import { UserController } from 'src/controllers/user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppService } from 'src/services/app.service';
import { SampleService } from 'src/services/sample.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AppController, UserController, SampleController],
  providers: [AppService, UserService, SampleService],
})
export class AppModule {}
