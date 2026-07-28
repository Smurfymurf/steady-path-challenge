import { json, type Handler } from './_lib/http';

interface VisitNotifyBody {
  countryCode?: string | null;
  offerGeo?: string;
  prizeWheel?: boolean;
  referrer?: string;
  path?: string;
  visitorKey?: string;
}

const DEDUP_MS = 6 * 60 * 60 * 1000;
const recentVisitors = new Map<string, number>();
const MASCOT_THUMB = 'https://fingerchallenge.com/assets/branding/finger-mascot.png';

function resolveVisitorWebhook(): string | undefined {
  return process.env.DISCORD_VISITOR_WEBHOOK_URL?.trim()
    || process.env.DISCORD_WEBHOOK_URL?.trim();
}

function visitorPing(): string {
  const raw = process.env.DISCORD_VISITOR_PING?.trim();
  if (raw === 'none' || raw === 'off' || raw === 'false') {
    return '';
  }
  if (raw) {
    return raw;
  }
  return '@here';
}

function countryFlag(code: string): string {
  const normalised = code.toUpperCase() === 'UK' ? 'GB' : code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalised) || normalised === '??') {
    return '🌍';
  }
  return String.fromCodePoint(
    ...[...normalised].map((char) => 0x1F1E6 + char.charCodeAt(0) - 65),
  );
}

function clientIp(event: { headers: Record<string, string | undefined> }): string {
  return (
    event.headers['x-nf-client-connection-ip']
    ?? event.headers['client-ip']
    ?? event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    ?? 'unknown'
  );
}

function shouldNotify(dedupKey: string): boolean {
  const now = Date.now();
  const last = recentVisitors.get(dedupKey);
  if (last != null && now - last < DEDUP_MS) {
    return false;
  }
  recentVisitors.set(dedupKey, now);
  if (recentVisitors.size > 500) {
    for (const [key, ts] of recentVisitors) {
      if (now - ts > DEDUP_MS) {
        recentVisitors.delete(key);
      }
    }
  }
  return true;
}

/**
 * POST /.netlify/functions/visit-notify
 * Discord ping for a new site visitor (deduped ~6h per IP / visitor key).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const webhookUrl = resolveVisitorWebhook();
  if (!webhookUrl) {
    return json(503, {
      error: 'DISCORD_VISITOR_WEBHOOK_URL or DISCORD_WEBHOOK_URL is not configured',
      code: 'discord_not_configured',
    });
  }

  let body: VisitNotifyBody = {};
  try {
    body = event.body ? JSON.parse(event.body) as VisitNotifyBody : {};
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const ip = clientIp(event);
  const visitorKey = (body.visitorKey ?? '').toString().slice(0, 64);
  const dedupKey = visitorKey || ip;
  if (!shouldNotify(dedupKey)) {
    return json(200, { success: true, skipped: true, reason: 'deduped' });
  }

  const country = (body.countryCode ?? '??').toString().toUpperCase().slice(0, 8);
  const offerGeo = (body.offerGeo ?? 'FALLBACK').toString().toUpperCase().slice(0, 16);
  const prizeWheel = Boolean(body.prizeWheel);
  const referrer = (body.referrer ?? 'direct').toString().slice(0, 200) || 'direct';
  const path = (body.path ?? '/').toString().slice(0, 120);
  const flag = countryFlag(country);
  const wheelLine = prizeWheel ? '🎡 **Prize wheel eligible** (US/UK)' : '⛔ Prize wheel hidden';
  const ping = visitorPing();

  const payload = {
    content: [
      ping,
      `## 👆🔥 NEW VISITOR — FINGER CHALLENGE`,
      `${flag} **${country}** · wheel geo **${offerGeo}**`,
      wheelLine,
    ].filter(Boolean).join('\n'),
    embeds: [
      {
        author: {
          name: 'Finger Challenge · LIVE TRAFFIC',
          icon_url: MASCOT_THUMB,
        },
        title: `${flag} Someone just landed`,
        description: [
          '**fingerchallenge.com** got a hit.',
          '',
          `🌐 **Country:** \`${country}\``,
          `🎯 **Offer geo:** \`${offerGeo}\``,
          `🎡 **Prize wheel:** ${prizeWheel ? '**ON** (US/UK)' : 'off'}`,
          `📄 **Page:** \`${path}\``,
          `🔗 **Referrer:** ${referrer}`,
        ].join('\n'),
        color: 0xff3d7f,
        thumbnail: { url: MASCOT_THUMB },
        timestamp: new Date().toISOString(),
        footer: { text: 'Finger Challenge · new visitor alert' },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return json(502, {
        error: `Discord webhook failed (${response.status})`,
        detail: text.slice(0, 200),
      });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(502, {
      error: error instanceof Error ? error.message : 'Discord notify failed',
    });
  }
};
