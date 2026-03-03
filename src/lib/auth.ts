import { apiFetch, ApiError } from './api';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'PATRON';
}

interface LoginResponse {
  user: AuthUser;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF' | 'PATRON';
    createdAt: string;
    loans: unknown[];
  };
}

// Demo user for offline/local development when backend is unavailable
const DEMO_USER: AuthUser = {
  userId: 'demo-admin-001',
  email: 'admin@shelfsight.com',
  name: 'Demo Admin',
  role: 'ADMIN',
};

const DEMO_SESSION_KEY = 'shelfsight_demo_session';

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  try {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return data.user;
  } catch (err) {
    // Fallback to demo login when backend is unreachable
    if (err instanceof ApiError && err.status === 0) {
      if (email === 'admin@shelfsight.com' && password === 'password123') {
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
        return DEMO_USER;
      }
    }
    throw err;
  }
}

export async function logoutApi(): Promise<void> {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Backend unreachable — demo session already cleared above
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const data = await apiFetch<MeResponse>('/auth/me');
    return {
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    };
  } catch {
    // Check for demo session when backend is unreachable
    const stored = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored) as AuthUser;
    }
    throw new ApiError(0, 'No active session');
  }
}
