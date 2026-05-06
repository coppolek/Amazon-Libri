import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, auth, messaging } from '../lib/firebase';
import { UserProfile } from '../types';

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
      
    await updateDoc(doc(db, 'users', userId), {
      followedAuthors: newAuthors,
      updatedAt: serverTimestamp()
    });
  };

  const toggleFollowCategory = async (category: string) => {
    if (!auth.currentUser || !profile) return;
    const userId = auth.currentUser.uid;
    const categories = profile.followedCategories || [];
    const newCategories = categories.includes(category) 
      ? categories.filter(c => c !== category)
      : [...categories, category];
      
    await updateDoc(doc(db, 'users', userId), {
      followedCategories: newCategories,
      updatedAt: serverTimestamp()
    });
  };

  const saveFCMToken = async (token: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    await setDoc(doc(db, 'users', userId), {
      fcmToken: token,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const requestPushPermission = async () => {
    if (!auth.currentUser) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
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
