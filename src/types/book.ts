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
  /** 1-based slot within the tier for ordering on the map (optional). */
  shelfSlot: number | null;
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

export type BookFormData = Omit<
  Book,
  "id" | "dateAdded" | "lastModified" | "shelfId" | "shelfTier" | "shelfSlot"
> & {
  shelfId?: string | null;
  shelfTier?: number | null;
  shelfSlot?: number | null;
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
  /** Only books with at least one unshelved AVAILABLE copy (API: unshelved=1). */
  unshelved?: boolean;
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
