import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AppNotification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
      // Note: we might need a composite index if we order by createdAt and where userId. Let's sort locally to avoid immediate composite index needs if not many notifications.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const markAsRead = async (notificationId: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
    await Promise.all(promises);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}

// Function to simulate backend adding a notification for new books
export async function simulateNewBookNotification(userId: string, title: string, body: string, bookId?: string) {
  const notifRef = doc(collection(db, 'notifications'));
  await setDoc(notifRef, {
    userId,
    title,
    body,
    bookId: bookId || null,
    read: false,
    createdAt: serverTimestamp()
  });
}
