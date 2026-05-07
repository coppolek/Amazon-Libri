export const AFFILIATE_TAG = 'ama013-21';
export const BOOKS_NODE = '411663031';

/**
 * Genera il link affiliato Amazon per un prodotto
 */
export function getAmazonAffiliateLink(title: string, author: string, asinOrIsbn?: string) {
  const baseUrl = 'https://www.amazon.it';
  
  if (asinOrIsbn) {
    const cleanId = asinOrIsbn.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanId.length === 10 || cleanId.length === 13) {
      return `${baseUrl}/dp/${cleanId}?tag=${AFFILIATE_TAG}`;
    }
  }

  // Fallback to search if no valid ID
  const searchQuery = `${title}`;
  const query = encodeURIComponent(searchQuery.trim()).replace(/%20/g, '+');
  
  return `${baseUrl}/s?k=${query}&i=stripbooks&tag=${AFFILIATE_TAG}`;
}

