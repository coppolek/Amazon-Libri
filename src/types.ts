export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string;
  category: string;
  coverUrl?: string;
  pageCount?: number;
  publishedDate?: string;
  publisher?: string;
  averageRating?: number;
  ratingsCount?: number;
}

export type Category = string;

export interface Review {
  id: string; // userId_bookId
  userId: string;
  bookId: string;
  rating: number;
  text: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  id: string; // userId
  fcmToken?: string;
  followedAuthors?: string[];
  followedCategories?: string[];
  updatedAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  bookId?: string;
  read: boolean;
  createdAt: any;
}
