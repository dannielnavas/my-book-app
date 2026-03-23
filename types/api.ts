/**
 * Tipos alineados con la API del backend (nombres en español donde aplica).
 */

export type ReadingStatus = "pending" | "in_progress" | "read";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  xpPoints?: number;
  level?: number;
  readingStreakDays?: number;
  lastReadAt?: string | null;
  planId?: number | null;
}

export interface Book {
  bookId: number;
  userId: number;
  isbn: string | null;
  title: string;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  genre: string | null;
  totalPages: number | null;
  pagesRead: number;
  isOwned: boolean;
  readingStatus: ReadingStatus;
  isBorrowed: boolean;
  borrowedToName: string | null;
  borrowedAt: string | null;
  addedAt: string;
}

/** Resultado de búsqueda externa (Google Books, Open Library) */
export interface ResultadoBusqueda {
  title: string;
  isbn?: string | null;
  author?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  genre?: string | null;
  totalPages?: number | null;
  source?: string;
  externalId?: string | null;
}

/** Body para POST /api/books */
export interface CreateBookDto {
  title: string;
  author?: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  totalPages?: number;
  isOwned?: boolean;
}

/** Body para PATCH /api/books/:id */
export interface UpdateBookDto {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  imageUrl?: string;
  genre?: string;
  totalPages?: number;
  pagesRead?: number;
  readingStatus?: ReadingStatus;
  isOwned?: boolean;
  isBorrowed?: boolean;
  borrowedToName?: string;
  borrowedAt?: string;
}

/** Body para PATCH /api/books/:id/paginas */
export interface UpdatePagesDto {
  pagesRead: number;
}

/** Body para POST /api/ai/recomendaciones */
export interface CrearRecomendacionDto {
  promptSent: string;
  aiResponseJson: Record<string, unknown>;
  aiModel: string;
}

export interface AuthLoginResponse {
  usuario: Usuario;
  accessToken: string;
}
