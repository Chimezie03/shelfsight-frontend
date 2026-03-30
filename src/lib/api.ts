/**
 * Base API utility for communicating with the ShelfSight backend.
 *
 * All requests include `credentials: 'include'` so that the HttpOnly
 * JWT cookie is automatically sent with every request.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractPagination(meta: unknown): UnknownRecord | undefined {
  if (!isRecord(meta)) {
    return undefined;
  }

  const nested = meta.pagination;
  if (isRecord(nested)) {
    return nested;
  }

  if (
    typeof meta.page === 'number' &&
    typeof meta.limit === 'number' &&
    typeof meta.total === 'number' &&
    typeof meta.totalPages === 'number'
  ) {
    return {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.totalPages,
    };
  }

  return undefined;
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
  } catch {
    throw new ApiError(0, 'Network error — unable to reach the server');
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
