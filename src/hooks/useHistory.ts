import { useState, useEffect } from 'react';
import { Book } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<Book[]>(() => {
    try {
      const item = window.localStorage.getItem('libri-scelti-history');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.warn('Errore lettura localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('libri-scelti-history', JSON.stringify(history));
    } catch (error) {
      console.warn('Errore scrittura su localStorage', error);
    }
  }, [history]);

  const addToHistory = (book: Book) => {
    setHistory(prev => {
      // Remove the book if it already exists to move it to the top
      const filtered = prev.filter(b => b.id !== book.id);
      // Add to beginning and limit to 50 items
      return [book, ...filtered].slice(0, 50);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addToHistory, clearHistory };
}
