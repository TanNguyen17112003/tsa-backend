// src/firebase-admin.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminConfigService {
  constructor(private configService: ConfigService) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')
            ? this.configService.get<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
            : undefined,
        }),
      });
    }
  }
}

export { admin };