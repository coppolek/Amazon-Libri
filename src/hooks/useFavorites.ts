import { useState, useEffect } from 'react';
import { Book } from '../types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Book[]>(() => {
    try {
      const item = window.localStorage.getItem('libri-scelti-favorites');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.warn('Errore lettura localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('libri-scelti-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.warn('Errore scrittura su localStorage', error);
    }
  }, [favorites]);

  const toggleFavorite = (book: Book) => {
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === book.id);
      if (isFav) {
        return prev.filter(f => f.id !== book.id);
      } else {
        return [...prev, book];
      }
    });
  };

  const isFavorite = (bookId: string) => {
    return favorites.some(f => f.id === bookId);
  };

  return { favorites, toggleFavorite, isFavorite };
}
