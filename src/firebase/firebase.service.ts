import * as admin from 'firebase-admin';

export abstract class FirebaseService {
  abstract getAuth(): admin.auth.Auth;
  abstract getMessaging(): admin.messaging.Messaging;
}
