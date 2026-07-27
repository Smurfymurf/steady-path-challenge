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

export function requireAdmin(event: HandlerEvent): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  const header = event.headers.authorization ?? event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) {
    return false;
  }
  const token = header.slice('Bearer '.length).trim();
  return token === expected;
}

export type { Handler };