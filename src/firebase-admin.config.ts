import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

const configService = new ConfigService();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY')
      ? configService.get<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
      : undefined,
  }),
});

export { admin };
