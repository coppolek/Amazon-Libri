import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, Heart, Eye } from 'lucide-react';
import { Book } from '../types';
import { getAmazonAffiliateLink } from '../lib/amazon';
import { ShareButtons } from './ShareButtons';

import { RatingDisplay } from './RatingDisplay';

interface BookCardProps {
  book: Book;
  delay?: number;
  onClick: () => void;
  onQuickView?: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  delay = 0, 
  onClick,
  onQuickView,
  isFavorite,
  onToggleFavorite 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const amazonUrl = getAmazonAffiliateLink(book.title, book.author, book.isbn);
  
  // Se disponibile cover dal Google Books API usiamo quella (migliore qualità),
  // altrimenti fallback su OpenLibrary o placeholder
  const coverUrl = book.coverUrl 
    ? book.coverUrl.replace('&edge=curl', '') // Migliora la qualità da Google
    : `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?q=${encodeURIComponent(book.title)}` : amazonUrl;

  const [clickedAmazon, setClickedAmazon] = useState(false);

  const handleAmazonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking amazon link
    
    // Mostra il feedback visivo temporaneo
    setClickedAmazon(true);
    setTimeout(() => setClickedAmazon(false), 2000);

    window.open(amazonUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group flex flex-row sm:flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="relative block w-32 sm:w-full flex-shrink-0 aspect-[2/3] bg-slate-100 overflow-hidden">
        {!imageError ? (
          <>
            {/* Placeholder / Skeleton Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse flex flex-col items-center justify-center p-4 text-center">
                 <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-amber-500 animate-spin mb-3"></div>
                 <span className="text-xs text-slate-500 font-medium">Caricamento...</span>
              </div>
            )}
            <img
              src={coverUrl}
              alt={`Copertina di ${book.title}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-95 relative z-0 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-amber-50 relative z-0">
            <span className="font-serif text-xl font-bold text-amber-900 leading-tight mb-2">
              {book.title}
            </span>
            <span className="text-sm font-medium text-amber-700">
              {book.author}
            </span>
          </div>
        )}
        
        {/* Quick View Button overlay */}
        {onQuickView && (
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-slate-900/60 to-transparent z-10 hidden sm:flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(e);
              }}
              className="bg-white/95 backdrop-blur-sm text-slate-800 hover:text-amber-600 px-4 py-2 rounded-full text-sm font-bold shadow-md transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          </div>
        )}
        
        {/* Etichetta Categoria */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-slate-800 shadow-sm z-10">
          {book.category}
        </div>

        {/* Pulsante Preferiti */}
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className={`absolute top-3 right-3 p-3 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-20 ${isFavorite ? 'text-red-500 bg-red-50/90' : 'text-slate-400 hover:text-red-500'}`}
          aria-label={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        >
          <Heart className={`w-5 h-5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </motion.button>

        {/* Pulsante Quick View Mobile */}
        {onQuickView && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(e);
            }}
            className="absolute top-3 right-14 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-20 text-slate-500 sm:hidden"
            aria-label="Quick View"
          >
            <Eye className="w-5 h-5" />
          </motion.button>
        )}
      </div>

        <div className="flex flex-col flex-grow p-4">
        <div className="block text-lg font-serif font-bold text-slate-900 leading-tight mb-1 group-hover:text-amber-600 transition-colors">
          {book.title}
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">{book.author}</p>
        
        {book.publisher && (
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
            {book.publisher}
          </p>
        )}
        {!book.publisher && <div className="mb-2"></div>}
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-slate-500">
          {book.publishedDate && (
            <span title="Data di pubblicazione">{new Date(book.publishedDate).getFullYear()}</span>
          )}
          {book.publishedDate && book.pageCount && <span>•</span>}
          {book.pageCount && (
            <span title="Numero di pagine">{book.pageCount} pag.</span>
          )}
        </div>

        <div className="mb-3 hidden sm:block">
          <RatingDisplay rating={book.averageRating || 0} count={book.ratingsCount || 0} size={14} />
        </div>
        <div className="hidden sm:block flex-grow mb-4">
          <p 
            className={`text-sm text-slate-600 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}
            dangerouslySetInnerHTML={{ __html: book.description || 'Nessuna descrizione disponibile.' }}
          />
          {book.description && book.description.length > 150 && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsExpanded(!isExpanded); 
              }}
              className="text-amber-600 text-xs font-semibold hover:text-amber-700 mt-1 inline-block"
            >
              {isExpanded ? 'Mostra meno' : 'Leggi di più'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <div className="flex justify-start">
            <ShareButtons title={book.title} url={shareUrl} />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAmazonClick}
            className={`w-full flex items-center justify-center gap-2 ${clickedAmazon ? 'bg-green-600 hover:bg-green-700 shadow-inner' : 'bg-amber-500 hover:bg-amber-600 shadow-sm'} text-white py-2.5 rounded-lg font-medium transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
          >
            {clickedAmazon ? (
              <>
                <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apertura...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Acquista su Amazon
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
