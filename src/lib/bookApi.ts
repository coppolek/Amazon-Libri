import { Book } from '../types';

// Fallback in caso di indisponibilità delle API di Google Books (es. errore 503)
const FALLBACK_BOOKS: Book[] = [
  {
    id: "fb-1",
    title: "Il Nome della Rosa",
    author: "Umberto Eco",
    description: "Un thriller storico ambientato in un monastero benedettino del XIV secolo.",
    isbn: "9788845246340",
    category: "Narrativa",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9788845246340-L.jpg",
    pageCount: 503,
    publisher: "Bompiani"
  },
  {
    id: "fb-2",
    title: "Sapiens. Da animali a dèi",
    author: "Yuval Noah Harari",
    description: "Una breve storia dell'umanità.",
    isbn: "9788845296499",
    category: "Saggistica",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9788845296499-L.jpg",
    pageCount: 539,
    publisher: "Bompiani"
  },
  {
    id: "fb-3",
    title: "Dune",
    author: "Frank Herbert",
    description: "Il più grande classico della fantascienza.",
    isbn: "9788834739679",
    category: "Fantascienza",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9788834739679-L.jpg"
  },
  {
    id: "fb-4",
    title: "Dieci piccoli indiani",
    author: "Agatha Christie",
    description: "Il capolavoro della regina del giallo.",
    isbn: "9788804704386",
    category: "Gialli",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9788804704386-L.jpg"
  }
];

export async function searchRealBooks(query: string, maxResults = 16, startIndex = 0, orderBy = 'relevance'): Promise<{ items: Book[], totalItems: number }> {
  try {
    const q = query.trim() || 'romanzi italiani';
    // Amazon usa le pagine. Convertiamo startIndex in page.
    const page = Math.floor(startIndex / maxResults) + 1;
    
    const url = `/api/search?q=${encodeURIComponent(q)}&page=${page}`;
    
    let response = await fetch(url);
    
    let retries = 2;
    while (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(`API returned ${response.status}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      response = await fetch(url);
      retries--;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Scraping backend failed: ${response.status}`);
      return { items: FALLBACK_BOOKS, totalItems: FALLBACK_BOOKS.length };
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.warn("Nessun risultato da Amazon. Utilizzo catalogo fallback.");
      return { items: FALLBACK_BOOKS, totalItems: FALLBACK_BOOKS.length };
    }
    return { items: data.items, totalItems: data.totalItems };
  } catch (error) {
    console.error("Errore nello scaricamento dei libri da Amazon:", error);
    return { items: FALLBACK_BOOKS, totalItems: FALLBACK_BOOKS.length };
  }
}
