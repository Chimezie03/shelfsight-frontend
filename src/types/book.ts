export type BookStatus = "available" | "checked-out" | "maintenance";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  dewey: string;
  category: string;
  location: string;
  shelfId: string | null;
  shelfTier: number | null;
  status: BookStatus;
  copies: number;
  publisher: string;
  publishYear: number;
  edition: string;
  language: string;
  pageCount: number;
  description: string;
  subjects: string[];
  coverImageUrl: string;
  dateAdded: string;
  lastModified: string;
}

export type BookFormData = Omit<Book, "id" | "dateAdded" | "lastModified" | "shelfId" | "shelfTier"> & {
  shelfId?: string | null;
  shelfTier?: number | null;
};

export type SortField =
  | "title"
  | "author"
  | "dewey"
  | "publishYear"
  | "dateAdded"
  | "status";

export type SortDirection = "asc" | "desc";

export interface BookQueryParams {
  search?: string;
  category?: string;
  status?: string;
  language?: string;
  yearMin?: number;
  yearMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortDir?: SortDirection;
}

export interface CatalogCopyStats {
  available: number;
  checkedOut: number;
  totalCopies: number;
}

export interface BookListResponse {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
  stats: CatalogCopyStats | null;
}
