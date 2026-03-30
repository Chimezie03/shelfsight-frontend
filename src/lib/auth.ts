import { apiFetch } from './api';

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

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return data.user;
}

export async function logoutApi(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiFetch<MeResponse>('/auth/me');
  return {
    userId: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
  };
}
