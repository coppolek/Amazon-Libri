import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Book } from '../types';

interface QuickViewModalProps {
  book: Book | null;
  onClose: () => void;
}

export function QuickViewModal({ book, onClose }: QuickViewModalProps) {
  // Mantieni il riferimento al libro precedente per l'animazione di uscita
  const [displayBook, setDisplayBook] = useState<Book | null>(book);

  useEffect(() => {
    if (book) setDisplayBook(book);
  }, [book]);

  if (!displayBook) return null;

  const coverUrl = displayBook.coverUrl
    ? displayBook.coverUrl.replace('&edge=curl', '')
    : `https://covers.openlibrary.org/b/isbn/${displayBook.isbn}-L.jpg`;

  return (
    <AnimatePresence>
      {book && (
        <motion.div 
          key="quickview-wrapper"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="quickview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            key="quickview-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 flex flex-col max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="w-32 h-48 sm:w-40 sm:h-60 flex-shrink-0 mx-auto sm:mx-0 overflow-hidden rounded-lg shadow-sm border border-slate-200 bg-slate-100 relative">
                <img
                  src={coverUrl}
                  alt={`Copertina di ${displayBook.title}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <h2 className="text-xl font-serif font-bold text-slate-900 leading-tight mb-2 pr-8">
                  {displayBook.title}
                </h2>
                <p className="text-base text-slate-600 font-medium mb-4">
                  {displayBook.author}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">
                    {displayBook.category}
                  </span>
                  {displayBook.pageCount && (
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                      {displayBook.pageCount} pag.
                    </span>
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Trama</h3>
                  <p 
                    className="text-sm text-slate-600 line-clamp-6 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: displayBook.description || 'Nessuna descrizione disponibile.' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
