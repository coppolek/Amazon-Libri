export const AFFILIATE_TAG = 'ama013-21';
export const BOOKS_NODE = '411663031';

/**
 * Genera il link affiliato Amazon per un prodotto
 */
export function getAmazonAffiliateLink(title: string, author: string, asinOrIsbn?: string) {
  const baseUrl = 'https://www.amazon.it';
  
  // Utilizziamo titolo (e autore se presente) per far corrispondere il formato richiesto
  const searchQuery = `${title}`;
  const query = encodeURIComponent(searchQuery.trim()).replace(/%20/g, '+');
  
  return `${baseUrl}/s?k=${query}&tag=${AFFILIATE_TAG}`;
}

