import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Menu, Loader2, Heart, ChevronLeft, ChevronRight, LogIn, LogOut, Filter, X, Bell, History, ArrowUp } from 'lucide-react';
import { BookCard } from './components/BookCard';
import { BookDetailsModal } from './components/BookDetailsModal';
import { QuickViewModal } from './components/QuickViewModal';
import { MessageModal } from './components/MessageModal';
import { AdBanner } from './components/AdBanner';
import { NotificationsPanel } from './components/NotificationsPanel';
import { Category, Book, Review } from './types';
import { searchRealBooks } from './lib/bookApi';
import { useFavorites } from './hooks/useFavorites';
import { useHistory } from './hooks/useHistory';
import { useAuth } from './hooks/useAuth';
import { useReviews } from './hooks/useReviews';
import { useNotifications, simulateNewBookNotification } from './hooks/useNotifications';
import { useUserProfile } from './hooks/useUserProfile';
import amazonReleasesRaw from './lib/amazon-releases.json';

const amazonReleases: Book[] = amazonReleasesRaw.map((b, i) => ({
  id: `amazon_release_${i}`,
  title: b.title,
  author: b.author,
  coverUrl: b.coverUrl,
  description: "Una delle novità più interessanti in uscita ora su Libri. (Fonte: Amazon Libri in Evidenza)",
  isbn: b.isbn || "",
  category: "In Evidenza",
  publishedDate: new Date().toISOString().split('T')[0]
}));


const MAIN_CATEGORIES: Category[] = [
  "Tutti",
  "Romanzi rosa",
  "Fantascienza e fantasy",
  "Gialli e thriller",
  "Fumetti e manga",
  "Libri per bambini",
  "Narrativa",
  "Saggistica",
  "Bambini e ragazzi",
  "Altre categorie",
  "Altre lingue"
];

const SUB_CATEGORIES: Record<string, string[]> = {
  "Narrativa": ["Fantascienza e fantasy", "Gialli e thriller", "Humour", "Letteratura e narrativa", "Romanzi rosa"],
  "Saggistica": [
    "Arte, cinema e fotografia", "Biografie, diari e memorie", "Calendari e agende", 
    "Diritto", "Dizionari e opere di consultazione", "Economia, affari e finanza", 
    "Famiglia, salute e benessere", "Guide di revisione e aiuto allo studio", 
    "Informatica, web e digital media", "Libri scolastici", "Libri universitari", 
    "Lingua, linguistica e scrittura", "Politica", "Religione", "Scienze, tecnologia e medicina", 
    "Self-help", "Società e scienze sociali", "Sport", "Storia", "Tempo libero", "Viaggi"
  ],
  "Bambini e ragazzi": ["Libri per bambini", "Adolescenti e ragazzi"],
  "Altre categorie": ["Fumetti e manga", "Erotica", "Libri LGBTQ+"],
  "Altre lingue": ["Libri in altre lingue", "eBook in altre lingue"]
};

// Mappa categorie per la ricerca API (keyword più specifiche in italiano)
const CATEGORY_QUERIES: Record<string, string> = {
  "Tutti": "novità bestseller libri",
  "Romanzi rosa": "romanzo rosa",
  "Fantascienza e fantasy": "fantascienza fantasy",
  "Gialli e thriller": "gialli thriller",
  "Fumetti e manga": "fumetti manga",
  "Libri per bambini": "libri bambini",
  "Narrativa": "narrativa",
  "Humour": "humour libro",
  "Letteratura e narrativa": "letteratura narrativa",
  "Saggistica": "saggistica",
  "Arte, cinema e fotografia": "libri arte cinema fotografia",
  "Biografie, diari e memorie": "biografie diari memorie",
  "Calendari e agende": "calendari agende",
  "Diritto": "libri diritto",
  "Dizionari e opere di consultazione": "dizionari opere consultazione",
  "Economia, affari e finanza": "economia affari finanza",
  "Famiglia, salute e benessere": "salute benessere",
  "Guide di revisione e aiuto allo studio": "guide revisione studio",
  "Informatica, web e digital media": "libri informatica web media",
  "Libri scolastici": "libri scolastici",
  "Libri universitari": "libri universitari",
  "Lingua, linguistica e scrittura": "lingua linguistica scrittura",
  "Politica": "libri politica",
  "Religione": "libri religione",
  "Scienze, tecnologia e medicina": "scienze tecnologia medicina",
  "Self-help": "self-help libri",
  "Società e scienze sociali": "società scienze sociali",
  "Sport": "libri sport",
  "Storia": "storia saggistica",
  "Tempo libero": "libri tempo libero",
  "Viaggi": "libri viaggi",
  "Bambini e ragazzi": "libri bambini ragazzi",
  "Adolescenti e ragazzi": "libri adolescenti ragazzi",
  "Altre categorie": "libri vari",
  "Erotica": "letteratura erotica",
  "Libri LGBTQ+": "libri lgbtq",
  "Altre lingue": "libri lingua straniera",
  "Libri in altre lingue": "libri in altre lingue",
  "eBook in altre lingue": "ebook in altre lingue"
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tutti");
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || "";
    } catch (e) {
      return "";
    }
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean; title: string; message: string; type: 'error' | 'success'}>({ isOpen: false, title: '', message: '', type: 'error' });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollPositions, setScrollPositions] = useState<Record<number, number>>({});
  const [modalScrollY, setModalScrollY] = useState(0);

  // Lock body scroll and save position when modals open
  useEffect(() => {
    if (selectedBook || quickViewBook) {
      setModalScrollY(window.scrollY);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      if (modalScrollY > 0) {
        window.scrollTo({ top: modalScrollY, behavior: 'instant' });
      }
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedBook, quickViewBook]);

  useEffect(() => {

    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { history, addToHistory, clearHistory } = useHistory();
  const { user, login, logout, isAuthReady } = useAuth();
  
  const { profile, isProfileLoading, toggleFollowAuthor, toggleFollowCategory } = useUserProfile();
  const { notifications, unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifiedBooks, setNotifiedBooks] = useState<Set<string>>(() => new Set());

  // Simulate pushing notifications when new books are discovered
  useEffect(() => {
    if (!profile || !user || books.length === 0) return;

    let hasNew = false;
    const newNotified = new Set(notifiedBooks);

    books.forEach(book => {
      if (newNotified.has(book.id)) return;

      const isFollowedAuthor = profile.followedAuthors?.includes(book.author);
      const isFollowedCategory = book.category && profile.followedCategories?.includes(book.category);

      if (isFollowedAuthor || isFollowedCategory) {
        // We simulate a backend adding a notification for the user
        const reason = isFollowedAuthor ? `l'autore ${book.author}` : `la categoria ${book.category}`;
        simulateNewBookNotification(
          user.uid,
          "Nuovo Libro Disponibile!",
          `È uscito "${book.title}" per ${reason}. Clicca per scoprirlo.`,
          book.id
        );
        newNotified.add(book.id);
        hasNew = true;
      }
    });

    if (hasNew) {
      setNotifiedBooks(newNotified);
    }
  }, [books, profile, user]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;
  const [totalApiItems, setTotalApiItems] = useState(0);

  type SortOption = 'relevance' | 'title' | 'author' | 'date' | 'popularity' | 'rating';
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterPublisher, setFilterPublisher] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Aggiungi ai visitati quando viene aperto il dettaglio
  useEffect(() => {
    if (selectedBook) {
      addToHistory(selectedBook);
    }
  }, [selectedBook]);

  // Recupera gli ID di tutti i libri (inclusi i preferiti) per calcolare le recensioni globali
  const allBookIds = useMemo(() => {
    const ids = new Set(books.map(b => b.id));
    favorites.forEach(f => ids.add(f.id));
    return Array.from(ids);
  }, [books, favorites]);
  
  const { reviews } = useReviews(allBookIds);

  // Reset page when search or category changes, but not on sort
  useEffect(() => {
    setCurrentPage(1);
    setScrollPositions({});
  }, [activeCategory, activeSubCategory, searchQuery, showFavorites, showHistory, filterAuthor, filterPublisher]);

  // Effettua lo scraping / fetching API pagination based
  useEffect(() => {
    if (showFavorites || showHistory) return;
    
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);
      
      const isHomePage = searchQuery.trim() === '' && activeCategory === 'Tutti' && !activeSubCategory;
      
      try {
        if (isHomePage) {
          // Usa le novità correnti di Amazon
          setBooks(amazonReleases);
          setTotalApiItems(amazonReleases.length);
        } else {
          // Se c'è una query di ricerca usiamo quella, altrimenti la categoria
          const categoryKey = activeSubCategory || activeCategory;
          const queryToSearch = searchQuery.trim() !== '' 
            ? searchQuery 
            : (CATEGORY_QUERIES[categoryKey] || 'libri');
            
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const apiOrderBy = sortBy === 'date' ? 'newest' : 'relevance';
          
          const { items, totalItems } = await searchRealBooks(queryToSearch, ITEMS_PER_PAGE, startIndex, apiOrderBy);
          
          setBooks(items);
          setTotalApiItems(totalItems);
        }
      } catch (err: any) {
        setBooks([]);
        setTotalApiItems(0);
        setError(err.message || "Impossibile recuperare i libri in questo momento.");
        setModalConfig({
          isOpen: true,
          title: "Errore di caricamento",
          message: err.message || "Impossibile recuperare i libri in questo momento.",
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce per evitare chiamate eccessive durante la digitazione
    const timeoutId = setTimeout(() => {
      fetchBooks();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeCategory, activeSubCategory, searchQuery, showFavorites, showHistory, currentPage, sortBy]);

  const totalItems = showHistory ? history.length : (showFavorites ? favorites.length : totalApiItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  
  let baseBooks = showHistory ? [...history] : (showFavorites ? [...favorites] : [...books]);

  let sortedBooks = baseBooks.map(book => {
    const bookReviews = reviews.filter(r => r.bookId === book.id);
    const ratingsCount = bookReviews.length;
    let averageRating = undefined;
    if (ratingsCount > 0) {
      averageRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) / ratingsCount;
    }
    return {
      ...book,
      averageRating,
      ratingsCount
    };
  });

  // Applico i filtri per Autore ed Editore
  if (filterAuthor.trim() !== '') {
    const q = filterAuthor.toLowerCase().trim();
    sortedBooks = sortedBooks.filter(book => (book.author || '').toLowerCase().includes(q));
  }
  
  if (filterPublisher.trim() !== '') {
    const q = filterPublisher.toLowerCase().trim();
    sortedBooks = sortedBooks.filter(book => (book.publisher || '').toLowerCase().includes(q));
  }

  // Applico la ricerca Fuzzy per tollerare errori di battitura
  if (searchQuery.trim() !== '' && sortBy === 'relevance' && !showFavorites && !showHistory) {
    const fuse = new Fuse(sortedBooks, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'author', weight: 0.3 },
        { name: 'publisher', weight: 0.1 },
        { name: 'description', weight: 0.1 }
      ],
      threshold: 0.4,
      distance: 100,
      ignoreLocation: true,
    });
    const results = fuse.search(searchQuery);
    // Se la ricerca fuzzy produce risultati, li usiamo, altrimenti manteniamo i risultati originali dell'API
    if (results.length > 0) {
      sortedBooks = results.map(r => r.item);
    }
  } else if (searchQuery.trim() !== '' && (showFavorites || showHistory)) {
    // Ricerca fuzzy anche nei preferiti e cronologia
    const fuse = new Fuse(sortedBooks, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'author', weight: 0.3 },
        { name: 'publisher', weight: 0.1 },
        { name: 'description', weight: 0.1 }
      ],
      threshold: 0.4,
      distance: 100,
      ignoreLocation: true,
    });
    sortedBooks = fuse.search(searchQuery).map(r => r.item);
  }

  if (sortBy === 'title') {
    sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'author') {
    sortedBooks.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
  } else if (sortBy === 'date') {
    sortedBooks.sort((a, b) => {
      const d1 = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const d2 = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return d2 - d1;
    });
  } else if (sortBy === 'popularity') {
    sortedBooks.sort((a, b) => {
      // Calcola uno score basato su valutazioni e data di pubblicazione
      let scoreA = (a.ratingsCount || 0) * 2 + (a.averageRating || 0) * 10;
      let scoreB = (b.ratingsCount || 0) * 2 + (b.averageRating || 0) * 10;
      
      const currentYear = new Date().getFullYear();
      
      const yearA = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
      const yearB = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
      
      // Bonus per i libri recenti (ultimi mesi o anni)
      if (yearA >= currentYear - 1) scoreA += 50;
      else if (yearA >= currentYear - 2) scoreA += 30;
      else if (yearA >= currentYear - 4) scoreA += 10;

      if (yearB >= currentYear - 1) scoreB += 50;
      else if (yearB >= currentYear - 2) scoreB += 30;
      else if (yearB >= currentYear - 4) scoreB += 10;
      
      // Aggiungi un piccolo peso alla data in caso di parità di score da recensioni (che quasi tutti a 0)
      if (scoreB === scoreA) {
        const timeA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const timeB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return timeB - timeA;
      }

      return scoreB - scoreA;
    });
  }

  const isHomePage = searchQuery.trim() === '' && activeCategory === 'Tutti' && !activeSubCategory;

  const displayedBooks = (showFavorites || showHistory || isHomePage || sortedBooks.length > ITEMS_PER_PAGE)
    ? sortedBooks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) 
    : sortedBooks;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header NavBar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 text-amber-600 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('Tutti');
              setActiveSubCategory(null);
              setShowFavorites(false);
              setShowHistory(false);
              setCurrentPage(1);
            }}
          >
            <BookOpen className="w-7 h-7" />
            <span className="font-serif font-bold text-xl tracking-tight text-slate-900">LibriScelti</span>
          </div>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cerca qualsiasi libro (scraping in tempo reale)..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowFavorites(false); }}
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none text-base md:text-sm transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 relative">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-full font-medium transition-colors ${
                    isNotificationsOpen ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Notifiche"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
                <NotificationsPanel 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)} 
                  onSelectBook={(id) => {
                    // Logic to open book detail? We might not have the book fetched.
                    // But maybe we do, or we open it later. Let's just do search.
                    setSearchQuery(id);
                  }}
                />
              </div>
            )}
            <button 
              onClick={() => {
                setShowHistory(false);
                setShowFavorites(!showFavorites);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-colors ${showFavorites ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-red-50 hover:text-red-500'}`}
              title="I tuoi Preferiti"
            >
              <Heart className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline text-sm">Preferiti ({favorites.length})</span>
            </button>
            <button 
              onClick={() => {
                setShowFavorites(false);
                setShowHistory(!showHistory);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-colors ${showHistory ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-500'}`}
              title="Cronologia visitati"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Cronologia</span>
            </button>
            <div className="flex border-l border-slate-200 pl-2 ml-2">
              {isAuthReady && user ? (
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-colors text-slate-600 hover:bg-slate-100"
                  title="Esci"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Esci</span>
                </button>
              ) : isAuthReady ? (
                <button 
                  onClick={login}
                  className="flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-colors text-green-600 hover:bg-green-50"
                  title="Accedi"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Accedi</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
        {/* Mobile Search - Visible only on small screens */}
        <div className="md:hidden relative mb-8">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cerca qualsiasi libro..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowFavorites(false); setShowHistory(false); }}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-sm"
            />
        </div>

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          {(!showFavorites && !showHistory && searchQuery === "" && activeCategory === "Tutti" && !activeSubCategory) ? (
            <>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Le novità più interessanti <br/><span className="text-amber-600">in Libri</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Esplora il database mondiale dei libri. Supportaci acquistando tramite i nostri link affiliati Amazon.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4 tracking-tight leading-tight">
                I migliori libri, <br/><span className="text-amber-600">trovati per te in tempo reale.</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Esplora il database mondiale dei libri. Supportaci acquistando tramite i nostri link affiliati Amazon.
              </p>
            </>
          )}
        </section>

        <AdBanner />



        {/* Loading Indicator */}
        {!showFavorites && !showHistory && isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
             <p className="font-medium">Ricerca dei libri in corso...</p>
          </div>
        )}

        {/* Error Indicator */}
        {!showFavorites && !showHistory && !isLoading && error && (
          <div className="text-center py-20 bg-red-50/50 rounded-2xl border border-red-100">
            <p className="text-red-500 text-lg font-medium">Ops! Qualcosa è andato storto.</p>
            <p className="text-red-400 mt-2">{error}</p>
            <button 
              onClick={() => { setSearchQuery(searchQuery + ' '); }} 
              className="mt-6 bg-red-100 hover:bg-red-200 text-red-600 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Riprova
            </button>
          </div>
        )}

        {/* Results Header with Sorting */}
        {(!isLoading && !error && (displayedBooks.length > 0 || showFavorites || showHistory)) && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            {showFavorites ? (
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">I tuoi Preferiti</h2>
                <p className="text-slate-500">Hai salvato {favorites.length} {favorites.length === 1 ? 'libro' : 'libri'} nei preferiti.</p>
              </div>
            ) : showHistory ? (
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2 flex items-center gap-2">
                  Cronologia
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <p className="text-slate-500">Hai visualizzato {history.length} {history.length === 1 ? 'libro' : 'libri'}.</p>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Cancella cronologia
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
                  {searchQuery 
                    ? `Risultati per "${searchQuery}"` 
                    : activeSubCategory 
                      ? activeSubCategory 
                      : activeCategory === 'Tutti' 
                        ? 'Le novità più interessanti in Libri' 
                        : activeCategory}
                </h2>
                <p className="text-slate-500">Trovati {totalApiItems} {totalApiItems === 1 ? 'libro' : 'libri'}.</p>
              </div>
            )}
            
            {displayedBooks.length > 0 && (
              <>
                {/* Desktop Sort & Filter Controls */}
                <div className="hidden sm:flex flex-row items-center gap-4 w-auto">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${isFilterOpen ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtri
                  </button>
                  <div className="flex items-center gap-2">
                    <label htmlFor="category-select" className="text-sm font-medium text-slate-600 whitespace-nowrap">Categoria:</label>
                    <select
                      id="category-select"
                      value={activeSubCategory || activeCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (MAIN_CATEGORIES.includes(val as any)) {
                          setActiveCategory(val as Category);
                          setActiveSubCategory(null);
                        } else {
                          // Find parent category
                          let parent: string | null = null;
                          for (const key of Object.keys(SUB_CATEGORIES)) {
                            if (SUB_CATEGORIES[key].includes(val)) {
                              parent = key;
                              break;
                            }
                          }
                          if (parent) {
                            setActiveCategory(parent as Category);
                            setActiveSubCategory(val);
                          } else {
                            setActiveCategory(val as Category);
                            setActiveSubCategory(null);
                          }
                        }
                        setSearchQuery("");
                        setShowFavorites(false);
                        setShowHistory(false);
                      }}
                      className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2 outline-none shadow-sm max-w-[200px]"
                    >
                      <option value="Tutti">Tutte le categorie</option>
                      {MAIN_CATEGORIES.filter(c => c !== "Tutti").map(cat => (
                        <optgroup key={cat} label={cat}>
                          <option key={`tutto-${cat}`} value={cat}>Tutto in {cat}</option>
                          {(SUB_CATEGORIES[cat] || []).map(sub => (
                            <option key={`sub-${sub}`} value={sub}>{sub}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-sm font-medium text-slate-600 whitespace-nowrap">Ordina per:</label>
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2 outline-none shadow-sm"
                    >
                      <option value="popularity">Bestseller (Popolarità)</option>
                      <option value="date">Novità (Più recenti)</option>
                      <option value="relevance">Rilevanza</option>
                      <option value="title">Titolo (A-Z)</option>
                      <option value="author">Autore (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Filter Button */}
                <div className="sm:hidden flex w-full mt-4">
                  <button 
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm"
                  >
                    <Filter className="w-4 h-4" />
                    Filtra e Ordina
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="hidden sm:block">
          {isFilterOpen && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:flex-1">
                <label htmlFor="filter-author" className="block text-sm font-medium text-slate-700 mb-1">
                  Filtra per Autore
                </label>
                <div className="relative">
                  <input
                    id="filter-author"
                    type="text"
                    placeholder="Es. Stephen King"
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-amber-500 focus:border-amber-500 pr-8"
                  />
                  {filterAuthor && (
                    <button onClick={() => setFilterAuthor('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full sm:flex-1">
                <label htmlFor="filter-publisher" className="block text-sm font-medium text-slate-700 mb-1">
                  Filtra per Editore
                </label>
                <div className="relative">
                  <input
                    id="filter-publisher"
                    type="text"
                    placeholder="Es. Mondadori"
                    value={filterPublisher}
                    onChange={(e) => setFilterPublisher(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-amber-500 focus:border-amber-500 pr-8"
                  />
                  {filterPublisher && (
                    <button onClick={() => setFilterPublisher('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {(!isLoading && !error && displayedBooks.length > 0) && (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentPage}-${searchQuery}-${activeCategory}-${showFavorites}-${showHistory}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {displayedBooks.map((book, idx) => (
                <BookCard 
                  key={`${book.id}-${idx}`} 
                  book={book} 
                  delay={idx * 0.05} 
                  onClick={() => setSelectedBook(book)}
                  onQuickView={() => setQuickViewBook(book)}
                  isFavorite={isFavorite(book.id)}
                  onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(book); }}
                />
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 w-fit mx-auto">
                <button
                  onClick={() => {
                    const currentY = window.scrollY;
                    setScrollPositions(prev => ({ ...prev, [currentPage]: currentY }));
                    const nextP = Math.max(1, currentPage - 1);
                    setCurrentPage(nextP);
                    setTimeout(() => {
                      window.scrollTo({ top: scrollPositions[nextP] || 0, behavior: 'instant' });
                    }, 10);
                  }}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-amber-100 hover:text-amber-700 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 transition-colors"
                  aria-label="Pagina precedente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm font-medium text-slate-600">
                  Pagina <strong className="text-slate-900">{currentPage}</strong> di {totalPages}
                </span>

                <button
                  onClick={() => {
                    const currentY = window.scrollY;
                    setScrollPositions(prev => ({ ...prev, [currentPage]: currentY }));
                    const nextP = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(nextP);
                    setTimeout(() => {
                      window.scrollTo({ top: scrollPositions[nextP] || 0, behavior: 'instant' });
                    }, 10);
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-amber-100 hover:text-amber-700 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 transition-colors"
                  aria-label="Pagina successiva"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </AnimatePresence>
        )}

        {!isLoading && !error && !showFavorites && !showHistory && displayedBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">Nessun libro trovato per "{searchQuery}".</p>
            <p className="text-slate-400 mt-2">Prova con termini più generici o controlla l'ortografia.</p>
          </div>
        )}

        {showFavorites && displayedBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">Nessun preferito salvato.</p>
            <p className="text-slate-400 mt-2">I libri che aggiungi ai preferiti appariranno qui.</p>
          </div>
        )}

        {showHistory && displayedBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">La tua cronologia è vuota.</p>
            <p className="text-slate-400 mt-2">I libri che visualizzi verranno mostrati qui.</p>
          </div>
        )}
      </main>

      {selectedBook && (
        <BookDetailsModal 
          book={selectedBook} 
          onClose={() => setSelectedBook(null)} 
          isFavorite={isFavorite(selectedBook.id)}
          onToggleFavorite={() => toggleFavorite(selectedBook)}
        />
      )}

      <QuickViewModal
        book={quickViewBook}
        onClose={() => setQuickViewBook(null)}
      />

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div 
              initial={{opacity:0}} 
              animate={{opacity:1}} 
              exit={{opacity:0}} 
              onClick={() => setIsMobileFiltersOpen(false)} 
              className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm sm:hidden" 
            />
            <motion.div 
              initial={{y:'100%'}} 
              animate={{y:0}} 
              exit={{y:'100%'}} 
              transition={{type: 'spring', bounce: 0, duration: 0.4}} 
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 sm:hidden pb-safe max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-xl text-slate-900">Filtra e Ordina</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label htmlFor="mobile-category-select" className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <select
                    id="mobile-category-select"
                    value={activeSubCategory || activeCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (MAIN_CATEGORIES.includes(val as any)) {
                        setActiveCategory(val as Category);
                        setActiveSubCategory(null);
                      } else {
                        // Find parent category
                        let parent: string | null = null;
                        for (const key of Object.keys(SUB_CATEGORIES)) {
                          if (SUB_CATEGORIES[key].includes(val)) {
                            parent = key;
                            break;
                          }
                        }
                        if (parent) {
                          setActiveCategory(parent as Category);
                          setActiveSubCategory(val);
                        } else {
                          setActiveCategory(val as Category);
                          setActiveSubCategory(null);
                        }
                      }
                      setSearchQuery("");
                      setShowFavorites(false);
                      setShowHistory(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-base rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-3 outline-none"
                  >
                    <option value="Tutti">Tutte le categorie</option>
                    {MAIN_CATEGORIES.filter(c => c !== "Tutti").map(cat => (
                      <optgroup key={cat} label={cat}>
                        <option key={`tutto-${cat}`} value={cat}>Tutto in {cat}</option>
                        {(SUB_CATEGORIES[cat] || []).map(sub => (
                          <option key={`sub-${sub}`} value={sub}>{sub}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mobile-sort-select" className="block text-sm font-bold text-slate-700 mb-2">Ordina per</label>
                  <select
                    id="mobile-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-base rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-3 outline-none"
                  >
                    <option value="popularity">Bestseller (Popolarità)</option>
                    <option value="date">Novità (Più recenti)</option>
                    <option value="relevance">Rilevanza</option>
                    <option value="title">Titolo (A-Z)</option>
                    <option value="author">Autore (A-Z)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mobile-filter-author" className="block text-sm font-bold text-slate-700 mb-2">Autore</label>
                  <div className="relative">
                    <input
                      id="mobile-filter-author"
                      type="text"
                      placeholder="Es. Stephen King"
                      value={filterAuthor}
                      onChange={(e) => setFilterAuthor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-base focus:ring-amber-500 focus:border-amber-500 pr-10"
                    />
                    {filterAuthor && (
                      <button onClick={() => setFilterAuthor('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="mobile-filter-publisher" className="block text-sm font-bold text-slate-700 mb-2">Editore</label>
                  <div className="relative">
                    <input
                      id="mobile-filter-publisher"
                      type="text"
                      placeholder="Es. Mondadori"
                      value={filterPublisher}
                      onChange={(e) => setFilterPublisher(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-base focus:ring-amber-500 focus:border-amber-500 pr-10"
                    />
                    {filterPublisher && (
                      <button onClick={() => setFilterPublisher('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsMobileFiltersOpen(false)} 
                className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-sm"
              >
                Applica
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdBanner />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg z-40 transition-colors flex items-center justify-center group"
            aria-label="Torna su"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-4 md:px-6 mt-24 text-center text-slate-500 text-sm">
        <p className="mb-2">© {new Date().getFullYear()} LibriScelti. Tutti i diritti riservati.</p>
        <p>In qualità di Affiliato Amazon, ricevo un guadagno dagli acquisti idonei tramite il codice <strong>ama013-21</strong>.</p>
      </footer>
    </div>
  );
}
