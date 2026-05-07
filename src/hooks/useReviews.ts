import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Review } from '../types';

export function useReviews(bookIds: string[]) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bookIds || bookIds.length === 0) {
      setReviews([]);
      return;
    }

    setIsLoading(true);
    
    // Chunk bookIds into batches of 30 due to Firestore array-contains/in limits
    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < bookIds.length; i += chunkSize) {
      chunks.push(bookIds.slice(i, i + chunkSize));
    }

    const unsubscribes = chunks.map(chunk => {
      const q = query(
        collection(db, 'reviews'),
        where('bookId', 'in', chunk)
      );

      return onSnapshot(q, (snapshot) => {
        const newReviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        
        setReviews(prev => {
          // Remove old reviews for these books and append new ones
          const filtered = prev.filter(r => !chunk.includes(r.bookId));
          return [...filtered, ...newReviews];
        });
        setIsLoading(false);
      }, (error) => {
        console.error('Error fetching reviews:', error);
        setIsLoading(false);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [JSON.stringify(bookIds)]);

  return { reviews, isLoading };
}

export async function submitReview(bookId: string, rating: number, text: string) {
  const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';
  const isAnonymous = userId === 'anonymous';
  const reviewId = isAnonymous ? `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` : `${userId}_${bookId}`;
  
  await setDoc(doc(db, 'reviews', reviewId), {
    userId,
    bookId,
    rating,
    text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteReview(bookId: string) {
  if (!auth.currentUser) throw new Error("Must be logged in to delete review");
  
  const userId = auth.currentUser.uid;
  const reviewId = `${userId}_${bookId}`;
  
  await deleteDoc(doc(db, 'reviews', reviewId));
}
