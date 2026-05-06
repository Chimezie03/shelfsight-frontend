import { test as base, expect, type BrowserContext, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Seeded credentials. Mirror the defaults in shelfsight-backend/prisma/seed.ts.
 */
export const USERS = {
  admin: { email: 'admin@shelfsight.com', password: 'password123', role: 'ADMIN' },
  staff: { email: 'maria.staff@shelfsight.com', password: 'password123', role: 'STAFF' },
  patron: { email: 'patron1@shelfsight.com', password: 'password123', role: 'PATRON' },
} as const;

export type Role = keyof typeof USERS;

/**
 * Log in through the backend directly (no UI) and pour the cookie into
 * the given BrowserContext. Faster than driving the login form, and it
 * keeps auth setup out of the spec under test.
 */
export async function loginAs(
  request: APIRequestContext,
  context: BrowserContext,
  role: Role,
): Promise<void> {
  const creds = USERS[role];
  const res = await request.post('http://localhost:3001/auth/login', {
    data: { email: creds.email, password: creds.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${role}: ${res.status()} ${await res.text()}`);
  }
  const setCookie = res.headers()['set-cookie'];
  if (!setCookie) throw new Error('No set-cookie header returned from /auth/login');

  // Parse the first Set-Cookie (there's only one: `token`).
  const tokenMatch = setCookie.match(/token=([^;]+)/);
  if (!tokenMatch) throw new Error(`Cookie header did not contain token: ${setCookie}`);

  await context.addCookies([
    {
      name: 'token',
      value: tokenMatch[1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Extend the base test so each spec gets an `authed` page logged in as
 * whichever role it asks for. Default role is admin.
 */
type Fixtures = {
  loginAs: (page: Page, role: Role) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  // Parameter must not be named `use` — ESLint's `react-hooks/rules-of-hooks` treats it as React's `use()`.
  loginAs: async ({ request, context }, provideFixture) => {
    await provideFixture(async (_page, role) => {
      await loginAs(request, context, role);
    });
  },
});

export { expect };
