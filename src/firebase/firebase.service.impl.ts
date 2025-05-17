import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseServiceImpl extends FirebaseService implements OnModuleInit {
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

  override getAuth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }

  override getMessaging(): admin.messaging.Messaging {
    return this.firebaseApp.messaging();
  }
}
