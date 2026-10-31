import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DiaryEntry, generateTextFileContent, generateTextFileName } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
    return false;
  }
}

// Auth Helpers
export const firebaseAuth = {
  async loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  },

  async loginWithEmail(email: string, pass: string) {
    return signInWithEmailAndPassword(auth, email, pass);
  },

  async registerWithEmail(name: string, email: string, pass: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred;
  },

  async logout() {
    return signOut(auth);
  },

  onStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};

// Check if current user is authenticated with Firebase
export function isFirebaseAuthenticated(): boolean {
  return Boolean(auth.currentUser);
}

// Firestore Entries Service
export const firestoreService = {
  async saveUserProfile(user: { id: string; name: string; email: string }) {
    if (!auth.currentUser || auth.currentUser.uid !== user.id) {
      return;
    }
    const path = `users/${user.id}`;
    try {
      await setDoc(
        doc(db, 'users', user.id),
        {
          id: user.id,
          name: user.name,
          email: user.email,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  subscribeUserEntries(
    userId: string,
    onSuccess: (entries: DiaryEntry[]) => void,
    onError?: (err: any) => void
  ) {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return () => {};
    }

    const path = `users/${userId}/entries`;
    const q = query(collection(db, 'users', userId, 'entries'), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const entries: DiaryEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const entryObj: DiaryEntry = {
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || '',
            content: data.content || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'pending',
            emotion: data.emotion || null,
            sentiment_score: data.sentiment_score ?? null,
            stress_level: data.stress_level ?? null,
            topic: data.topic || null,
            summary: data.summary || null,
            analyzedAt: data.analyzedAt || null,
            errorMessage: data.errorMessage || null,
            fileName: data.fileName || generateTextFileName(data.title, data.createdAt),
            textFileContent:
              data.textFileContent ||
              generateTextFileContent(
                data as any,
                auth.currentUser?.displayName || 'Người dùng',
                auth.currentUser?.email || ''
              ),
            fileType: data.fileType || 'text/plain',
          };
          entries.push(entryObj);
        });
        onSuccess(entries);
      },
      (error) => {
        console.warn('Lỗi lắng nghe dữ liệu Firestore:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  async addEntry(
    userId: string,
    entry: Omit<DiaryEntry, 'id'> | DiaryEntry
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Vui lòng đăng nhập Firebase để đẩy dữ liệu lên Firebase Console.');
    }
    const effectiveUserId = currentUser.uid;
    const entryId = 'id' in entry && entry.id ? entry.id : crypto.randomUUID();
    const path = `users/${effectiveUserId}/entries/${entryId}`;

    const authorName = currentUser.displayName || 'Người dùng';
    const authorEmail = currentUser.email || '';
    const fileName = entry.fileName || generateTextFileName(entry.title, entry.createdAt);
    const textFileContent =
      entry.textFileContent || generateTextFileContent(entry as any, authorName, authorEmail);

    try {
      await setDoc(doc(db, 'users', effectiveUserId, 'entries', entryId), {
        ...entry,
        id: entryId,
        userId: effectiveUserId,
        fileName,
        textFileContent,
        fileType: 'text/plain',
      });
      return entryId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  async updateEntry(
    userId: string,
    entryId: string,
    updateData: Partial<DiaryEntry>
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }
    const effectiveUserId = currentUser.uid;
    const path = `users/${effectiveUserId}/entries/${entryId}`;
    const authorName = currentUser.displayName || 'Người dùng';
    const authorEmail = currentUser.email || '';

    let updatedPayload: any = { ...updateData, userId: effectiveUserId };
    if (updateData.content || updateData.status || updateData.emotion) {
      updatedPayload.textFileContent =
        updateData.textFileContent ||
        generateTextFileContent(
          { ...updateData, id: entryId } as any,
          authorName,
          authorEmail
        );
      updatedPayload.fileType = 'text/plain';
    }

    try {
      await updateDoc(doc(db, 'users', effectiveUserId, 'entries', entryId), updatedPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  },

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }
    const effectiveUserId = currentUser.uid;
    const path = `users/${effectiveUserId}/entries/${entryId}`;
    try {
      await deleteDoc(doc(db, 'users', effectiveUserId, 'entries', entryId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  },

  async verifyEntryOnFirebase(
    userId: string,
    entryId: string
  ): Promise<{
    exists: boolean;
    path: string;
    data?: any;
    databaseId: string;
    projectId: string;
  }> {
    const path = `users/${userId}/entries/${entryId}`;
    try {
      const docSnap = await getDocFromServer(doc(db, 'users', userId, 'entries', entryId));
      if (docSnap.exists()) {
        return {
          exists: true,
          path,
          data: docSnap.data(),
          databaseId: firebaseConfig.firestoreDatabaseId,
          projectId: firebaseConfig.projectId,
        };
      }
      return {
        exists: false,
        path,
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      throw err;
    }
  },

  async syncAllEntriesToFirestore(
    userId: string,
    entries: DiaryEntry[]
  ): Promise<{ syncedCount: number; path: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Vui lòng đăng nhập Firebase để đẩy dữ liệu lên Firebase Console.');
    }
    const effectiveUserId = currentUser.uid;
    const authorName = currentUser.displayName || 'Người dùng';
    const authorEmail = currentUser.email || '';
    let count = 0;

    for (const entry of entries) {
      const entryId = entry.id || crypto.randomUUID();
      const fileName = entry.fileName || generateTextFileName(entry.title, entry.createdAt);
      const textFileContent =
        entry.textFileContent || generateTextFileContent(entry, authorName, authorEmail);

      await setDoc(doc(db, 'users', effectiveUserId, 'entries', entryId), {
        id: entryId,
        userId: effectiveUserId,
        title: entry.title || '',
        content: entry.content || '',
        createdAt: entry.createdAt || new Date().toISOString(),
        status: entry.status || 'pending',
        emotion: entry.emotion || null,
        sentiment_score: entry.sentiment_score ?? null,
        stress_level: entry.stress_level ?? null,
        topic: entry.topic || null,
        summary: entry.summary || null,
        analyzedAt: entry.analyzedAt || null,
        errorMessage: entry.errorMessage || null,
        fileName,
        textFileContent,
        fileType: 'text/plain',
      });
      count++;
    }
    return {
      syncedCount: count,
      path: `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${effectiveUserId}/entries`,
    };
  },
};

export { firebaseConfig };
