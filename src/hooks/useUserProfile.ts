import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, auth, messaging } from '../lib/firebase';
import { UserProfile } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const profileRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        // Create initial profile if it doesn't exist
        setDoc(profileRef, {
          updatedAt: serverTimestamp()
        }).catch(console.error);
      }
      setIsProfileLoading(false);
    }, (error) => {
      console.error('Error fetching profile:', error);
      setIsProfileLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const toggleFollowAuthor = async (author: string) => {
    if (!auth.currentUser || !profile) return;
    const userId = auth.currentUser.uid;
    const authors = profile.followedAuthors || [];
    const newAuthors = authors.includes(author) 
      ? authors.filter(a => a !== author)
      : [...authors, author];
      
    try {
      await updateDoc(doc(db, 'users', userId), {
        followedAuthors: newAuthors,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleFollowCategory = async (category: string) => {
    if (!auth.currentUser || !profile) return;
    const userId = auth.currentUser.uid;
    const categories = profile.followedCategories || [];
    const newCategories = categories.includes(category) 
      ? categories.filter(c => c !== category)
      : [...categories, category];
      
    try {
      await updateDoc(doc(db, 'users', userId), {
        followedCategories: newCategories,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const saveFCMToken = async (token: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    try {
      await setDoc(doc(db, 'users', userId), {
        fcmToken: token,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    }
  };

  const requestPushPermission = async () => {
    if (!auth.currentUser) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && messaging) {
        const token = await getToken(messaging, { 
          // vapidKey would be here if real push setup with GCP, but we can call it empty to test
        });
        if (token) {
          await saveFCMToken(token);
          console.log("Push token saved", token);
          return true;
        }
      }
    } catch (e) {
      console.log('Push notifications not available or blocked in iframe.', e);
    }
    return false;
  };

  return { profile, isProfileLoading, toggleFollowAuthor, toggleFollowCategory, saveFCMToken, requestPushPermission };
}
