import type { Handler, HandlerEvent } from '@netlify/functions';

export function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

export type AdminAuthResult = 'ok' | 'missing_config' | 'unauthorized';

/**
 * Validates the Bearer token against ADMIN_PASSWORD.
 * Distinguishes missing server config from a wrong password.
 */
export function checkAdmin(event: HandlerEvent): AdminAuthResult {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    return 'missing_config';
  }

  const header = event.headers.authorization
    ?? event.headers.Authorization
    ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    return 'unauthorized';
  }

  const token = header.slice('Bearer '.length).trim();
  return token === expected ? 'ok' : 'unauthorized';
}

export function requireAdmin(event: HandlerEvent): boolean {
  return checkAdmin(event) === 'ok';
}

/** Standard 401/503 responses for admin-gated functions. */
export function adminGate(event: HandlerEvent) {
  const result = checkAdmin(event);
  if (result === 'ok') {
    return null;
  }
  if (result === 'missing_config') {
    return json(503, {
      error: 'ADMIN_PASSWORD is not set on the server',
      code: 'admin_not_configured',
      hint: 'Add ADMIN_PASSWORD in Netlify → Site settings → Environment variables, then trigger a new deploy.',
    });
  }
  return json(401, {
    error: 'Unauthorized',
    code: 'unauthorized',
  });
}

export type { Handler };
