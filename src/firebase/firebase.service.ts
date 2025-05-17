import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  onModuleInit() {
    if (admin.apps.length === 0) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  getAuth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }

  getMessaging(): admin.messaging.Messaging {
    return this.firebaseApp.messaging();
  }
}
