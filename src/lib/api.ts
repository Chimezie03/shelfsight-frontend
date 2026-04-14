/**
 * Base API utility for communicating with the ShelfSight backend.
 *
 * All requests include `credentials: 'include'` so that the HttpOnly
 * JWT cookie is automatically sent with every request.
 */

// Default to /api so all requests go through the Next.js reverse proxy
// (see next.config.ts rewrites). Set NEXT_PUBLIC_API_URL only when you
// need to bypass the proxy and call the backend directly (e.g. during
// local development without the proxy: NEXT_PUBLIC_API_URL=http://localhost:3001).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizePaginationRecord(value: unknown): UnknownRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const page = toFiniteNumber(value.page);
  const limit = toFiniteNumber(value.limit);
  const total = toFiniteNumber(value.total);

  if (page === undefined || limit === undefined || total === undefined) {
    return undefined;
  }

  const safePage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.max(1, Math.trunc(limit));
  const safeTotal = Math.max(0, Math.trunc(total));

  const totalPagesValue = toFiniteNumber(value.totalPages);
  const safeTotalPages =
    totalPagesValue !== undefined
      ? Math.max(1, Math.trunc(totalPagesValue))
      : Math.max(1, Math.ceil(safeTotal / safeLimit));

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages: safeTotalPages,
  };
}

function extractPagination(meta: unknown): UnknownRecord | undefined {
  if (!isRecord(meta)) {
    return undefined;
  }

  return normalizePaginationRecord(meta.pagination) ?? normalizePaginationRecord(meta);
}

function normalizeSuccessPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  // Support universal API envelope shape: { success, data, meta, error }.
  if (typeof payload.success === 'boolean' && 'data' in payload) {
    const envelopeData = payload.data;
    const pagination = extractPagination(payload.meta);

    if (Array.isArray(envelopeData)) {
      if (pagination) {
        return { data: envelopeData, pagination };
      }
      return envelopeData;
    }

    if (isRecord(envelopeData)) {
      if (pagination && !('pagination' in envelopeData)) {
        return { ...envelopeData, pagination };
      }
      return envelopeData;
    }

    return envelopeData;
  }

  // Legacy backend payloads are already returned in final shape.
  return payload;
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const config: RequestInit = {
    credentials: 'include', // Send HttpOnly cookie
    headers,
    ...rest,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let res: Response;

  try {
    res = await fetch(url, config);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError(0, 'Network error - unable to reach the server');
  }

  if (!res.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await res.json();
    } catch {
      // response body may not be JSON
    }

    const envelopeError = isRecord(errorData.error) ? errorData.error : undefined;

    const message =
      (typeof envelopeError?.message === 'string' ? envelopeError.message : undefined) ||
      (typeof errorData.message === 'string' ? errorData.message : undefined) ||
      (res.status === 401
        ? 'Invalid credentials'
        : res.status === 403
          ? 'Access denied'
          : 'Something went wrong');

    throw new ApiError(res.status, message, errorData);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const payload = await res.json();
  return normalizeSuccessPayload(payload) as T;
}

/**
 * Upload a file via multipart/form-data.
 *
 * Unlike `apiFetch`, this does NOT set Content-Type - the browser auto-sets
 * the correct multipart boundary when given a FormData body.
 */
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError(0, 'Network error - unable to reach the server');
  }

  if (!res.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await res.json();
    } catch {
      // response body may not be JSON
    }

    const message =
      (errorData.message as string) ||
      ((errorData.error as Record<string, unknown>)?.message as string) ||
      (res.status === 401
        ? 'Invalid credentials'
        : res.status === 403
          ? 'Access denied'
          : 'Something went wrong');

    throw new ApiError(res.status, message, errorData);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
