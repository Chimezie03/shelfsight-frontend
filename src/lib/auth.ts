import { apiFetch } from './api';

export type Role = 'ADMIN' | 'STAFF' | 'PATRON';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
}

interface AuthResponse {
  user: AuthUser;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt: string;
    organizationId: string;
    organization: { id: string; name: string };
  };
}

function fromMe(payload: MeResponse['user']): AuthUser {
  return {
    userId: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    organizationId: payload.organizationId,
    organizationName: payload.organization.name,
  };
}

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
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
  return fromMe(data.user);
}

export async function signupApi(input: {
  orgName: string;
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: input,
  });
  return data.user;
}

export async function acceptInviteApi(input: {
  token: string;
  name: string;
  password: string;
}): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>('/auth/accept-invite', {
    method: 'POST',
    body: input,
  });
  return data.user;
}

export interface InvitePreview {
  organizationName: string;
  role: Role;
  email: string | null;
  expiresAt: string;
}

export async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  return apiFetch<InvitePreview>(`/auth/invites/${encodeURIComponent(token)}`);
}

export async function requestForgotPasswordApi(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPasswordApi(
  token: string,
  password: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}

export interface InviteCreateResponse {
  invite: {
    id: string;
    role: Role;
    email: string | null;
    expiresAt: string;
    createdAt: string;
  };
  token: string;
  url: string;
}

export async function createInviteApi(
  organizationId: string,
  input: { role: Role; email?: string },
): Promise<InviteCreateResponse> {
  return apiFetch<InviteCreateResponse>(`/orgs/${organizationId}/invites`, {
    method: 'POST',
    body: input,
  });
}

export interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  counts: {
    users: number;
    books: number;
    bookCopies: number;
    loans: number;
  };
}

interface OrgResponse {
  organization: OrgDetails;
}

export async function getOrgApi(organizationId: string): Promise<OrgDetails> {
  const data = await apiFetch<OrgResponse>(`/orgs/${organizationId}`);
  return data.organization;
}

export async function renameOrgApi(
  organizationId: string,
  name: string,
): Promise<OrgDetails> {
  const data = await apiFetch<OrgResponse>(`/orgs/${organizationId}`, {
    method: 'PATCH',
    body: { name },
  });
  return data.organization;
}

export async function deleteOrgApi(organizationId: string): Promise<void> {
  await apiFetch(`/orgs/${organizationId}`, { method: 'DELETE' });
}

export async function updateMyProfileApi(
  userId: string,
  input: { name?: string; email?: string; password?: string },
): Promise<void> {
  await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: input,
  });
}
