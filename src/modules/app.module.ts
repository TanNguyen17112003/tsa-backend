import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { UserService } from 'src/services/user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserController } from 'src/controllers/user.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SampleController } from 'src/controllers/sample.controller';
import { SampleService } from 'src/services/sample.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    JwtModule.register({
      secret: process.env.secret,
      signOptions: { expiresIn: '1d' }
    })
  ],
  controllers: [AppController, UserController, SampleController],
  providers: [AppService, UserService, SampleService],
})
export class AppModule {}
