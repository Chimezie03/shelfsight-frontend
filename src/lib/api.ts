/**
 * Base API utility for communicating with the ShelfSight backend.
 *
 * All requests include `credentials: 'include'` so that the HttpOnly
 * JWT cookie is automatically sent with every request.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    const message =
      (errorData.message as string) ||
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

  return res.json() as Promise<T>;
}
