import * as admin from 'firebase-admin';

export const firebaseProvider = {
  provide: 'FIREBASE_APP',
  useFactory: () => {
    if (admin.apps.length === 0) {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  },
};
