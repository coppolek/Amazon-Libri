import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star, Calendar, BookOpen, Layers, Heart, Barcode } from 'lucide-react';
import { Book } from '../types';
import { getAmazonAffiliateLink } from '../lib/amazon';
import { ShareButtons } from './ShareButtons';
import { AdBanner } from './AdBanner';
import { MessageModal } from './MessageModal';

import { RatingDisplay } from './RatingDisplay';
import { useReviews, submitReview, deleteReview } from '../hooks/useReviews';
import { useUserProfile } from '../hooks/useUserProfile';
import { User } from 'firebase/auth';

interface BookDetailsModalProps {
  book: Book;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e?: React.MouseEvent) => void;
  user?: User | null;
}

export function BookDetailsModal({ book, onClose, isFavorite, onToggleFavorite, user }: BookDetailsModalProps) {
  const amazonUrl = getAmazonAffiliateLink(book.title, book.author, book.isbn);
  const coverUrl = book.coverUrl 
    ? book.coverUrl.replace('&edge=curl', '')
    : `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?q=${encodeURIComponent(book.title)}` : amazonUrl;

  const [clickedAmazon, setClickedAmazon] = useState(false);

  const { reviews, isLoading: loadingReviews } = useReviews([book.id]);
  const { profile, toggleFollowAuthor, toggleFollowCategory } = useUserProfile();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean; title: string; message: string; type: 'error' | 'success'}>({ isOpen: false, title: '', message: '', type: 'error' });

  // Trova la recensione corrente dell'utente
  const myReview = user ? reviews.find(r => r.userId === user.uid) : null;
  const isFollowingAuthor = profile?.followedAuthors?.includes(book.author);
  const isFollowingCategory = book.category ? profile?.followedCategories?.includes(book.category) : false;

  const handleToggleFollowAuthor = async () => {
    try {
      await toggleFollowAuthor(book.author);
      const isNowFollowing = !isFollowingAuthor;
      setModalConfig({ isOpen: true, title: 'Successo', message: isNowFollowing ? `Ora segui ${book.author}.` : `Non segui più ${book.author}.`, type: 'success' });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: 'Errore', message: err.message || 'Errore durante l\'aggiornamento.', type: 'error' });
    }
  };

  const handleToggleFollowCategory = async () => {
    if(!book.category) return;
    try {
      await toggleFollowCategory(book.category);
      const isNowFollowing = !isFollowingCategory;
      setModalConfig({ isOpen: true, title: 'Successo', message: isNowFollowing ? `Ora segui la categoria ${book.category}.` : `Non segui più la categoria ${book.category}.`, type: 'success' });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: 'Errore', message: err.message || 'Errore durante l\'aggiornamento.', type: 'error' });
    }
  };

  React.useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setReviewText(myReview.text);
    }
  }, [myReview]);

  const handleAmazonClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setClickedAmazon(true);
    setTimeout(() => setClickedAmazon(false), 2000);
    window.open(amazonUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReview(book.id, rating, reviewText);
      setReviewText('');
      setModalConfig({ isOpen: true, title: 'Successo', message: 'Recensione inviata con successo!', type: 'success' });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: 'Errore', message: err.message || 'Errore nell\'inviare la recensione.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Sei sicuro di voler eliminare la tua recensione?")) return;
    try {
      await deleteReview(book.id);
      setModalConfig({ isOpen: true, title: 'Successo', message: 'Recensione eliminata.', type: 'success' });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: 'Errore', message: err.message || 'Errore nell\'eliminare la recensione.', type: 'error' });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10"
        >
           <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleFavorite}
            className="absolute top-4 right-14 p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-full transition-colors z-20"
            title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Left: Image (hidden on very small screens, or at top) */}
          <div className="w-full md:w-2/5 md:bg-slate-50 p-6 flex flex-col items-center justify-center relative border-r border-slate-100 shrink-0">
            <img 
              src={coverUrl} 
              alt={book.title} 
              className="w-48 md:w-full max-w-xs h-auto object-contain rounded shadow-lg mb-6"
            />
            
            <a
              href={amazonUrl}
              onClick={handleAmazonClick}
              className={`w-full flex justify-center items-center gap-2 ${clickedAmazon ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'} text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
            >
              {clickedAmazon ? (
                <>
                  <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apertura in corso...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Acquista su Amazon
                </>
              )}
            </a>
            <p className="text-xs text-slate-400 mt-3 text-center mb-4">
              Acquistando tramite questo link supporti il nostro progetto.
            </p>
            <ShareButtons title={book.title} url={shareUrl} />
          </div>

          {/* Right: Details */}
          <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  {book.category}
                </span>
                {user && book.category && (
                  <button
                    onClick={handleToggleFollowCategory}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      isFollowingCategory 
                        ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isFollowingCategory ? '✓ Segui categoria' : '+ Segui categoria'}
                  </button>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-slate-900 leading-tight mb-2">
                {book.title}
              </h2>
              <div className="flex flex-col sm:flex-row items-baseline sm:items-center gap-2 mb-3">
                <p className="text-xl text-slate-600 font-medium">{book.author}</p>
                {user && (
                  <button
                    onClick={handleToggleFollowAuthor}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      isFollowingAuthor 
                        ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isFollowingAuthor ? '✓ Segui già' : '+ Segui autore'}
                  </button>
                )}
              </div>
              
              <RatingDisplay rating={book.averageRating || 0} count={book.ratingsCount || 0} size={20} />
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                Dettagli Pubblicazione
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-200">
                  {book.publishedDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-2 sm:w-1/3 text-slate-500 mb-1 sm:mb-0">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">Anno di Pubblicazione</span>
                      </div>
                      <div className="sm:w-2/3 text-slate-900 font-semibold text-sm">
                        {book.publishedDate}
                      </div>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-2 sm:w-1/3 text-slate-500 mb-1 sm:mb-0">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">Editore</span>
                      </div>
                      <div className="sm:w-2/3 text-slate-900 font-semibold text-sm">
                        {book.publisher}
                      </div>
                    </div>
                  )}
                  {book.pageCount && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-2 sm:w-1/3 text-slate-500 mb-1 sm:mb-0">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">Pagine</span>
                      </div>
                      <div className="sm:w-2/3 text-slate-900 font-semibold text-sm">
                        {book.pageCount}
                      </div>
                    </div>
                  )}
                  {book.averageRating !== undefined && book.averageRating > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-2 sm:w-1/3 text-slate-500 mb-1 sm:mb-0">
                        <Star className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">Valutazione</span>
                      </div>
                      <div className="sm:w-2/3 text-slate-900 font-semibold text-sm flex items-center gap-2">
                         <div className="flex items-center bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                           <Star className="w-3 h-3 fill-amber-600 text-amber-600 mr-1" />
                           {book.averageRating}/5
                         </div>
                         {book.ratingsCount && (
                           <span className="text-slate-500 text-xs font-normal">
                             ({book.ratingsCount} recension{book.ratingsCount > 1 ? 'i' : 'e'})
                           </span>
                         )}
                      </div>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-100/80 transition-colors">
                      <div className="flex items-center gap-2 sm:w-1/3 text-slate-500 mb-1 sm:mb-0">
                        <Barcode className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">ISBN/ASIN</span>
                      </div>
                      <div className="sm:w-2/3 text-slate-900 font-semibold text-sm font-mono tracking-tight">
                        {book.isbn}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                Descrizione del libro
              </h3>
              <div 
                className="text-slate-700 leading-relaxed space-y-4 text-[15px] mb-6" 
                dangerouslySetInnerHTML={{ __html: book.description }} 
              />
              <AdBanner />
            </div>

            {/* Recensioni */}
            <div className="mb-8 border-t border-slate-200 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 font-serif">Recensioni dei Lettori</h3>
              
              <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">
                  {myReview ? "La TUA Recensione" : "Scrivi una Recensione"}
                </h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600">Voto:</label>
                    <select 
                      value={rating} 
                      onChange={e => setRating(Number(e.target.value))}
                      className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2"
                    >
                      {[5,4,3,2,1].map(num => (
                        <option key={num} value={num}>{num} Stelle</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <textarea 
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Cosa ne pensi di questo libro?"
                      required
                      rows={3}
                      className="block w-full p-3 text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="flex-1 sm:flex-none text-white bg-amber-500 hover:bg-amber-600 focus:ring-4 focus:ring-amber-300 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors disabled:opacity-50 text-center"
                      >
                        {submitting ? 'Salvataggio...' : (myReview ? 'Aggiorna Recensione' : 'Pubblica Recensione')}
                      </button>
                      {myReview && (
                        <button 
                          type="button" 
                          onClick={handleDeleteReview}
                          className="flex-1 sm:flex-none text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors text-center"
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                    {!user && (
                      <p className="text-xs text-slate-500 w-full sm:w-auto text-center sm:text-right">
                        Stai pubblicando come <strong>Ospite</strong>. Le recensioni degli ospiti non possono essere modificate.
                      </p>
                    )}
                  </div>
                </form>
              </div>

              {loadingReviews ? (
                <p className="text-slate-500 text-sm">Caricamento recensioni in corso...</p>
              ) : reviews.filter(r => !(user && r.userId === user.uid)).length > 0 ? (
                <div className="space-y-4">
                  {reviews.filter(r => !(user && r.userId === user.uid)).map(review => (
                    <div key={review.id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <RatingDisplay rating={review.rating} size={14} />
                          <span className="text-xs text-slate-400">
                            da {review.userId === 'anonymous' ? 'Ospite' : 'Utente verificato'}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-sm">Nessuna recensione presente per questo libro. Sii il primo a scriverne una!</p>
              )}
            </div>
            
          </div>
        </motion.div>
      </motion.div>
      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </AnimatePresence>
  );
}
