import { json, type Handler } from './_lib/http';

interface SpinNotifyBody {
  geo?: string;
  countryCode?: string | null;
  offerLabel?: string;
  offerId?: string;
  campaignId?: number | null;
  source?: string;
}

/**
 * POST /.netlify/functions/spin-notify
 * Fire-and-forget Discord alert when a player finishes a wheel spin.
 * Webhook URL stays server-side (DISCORD_WEBHOOK_URL).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return json(503, {
      error: 'DISCORD_WEBHOOK_URL is not configured',
      code: 'discord_not_configured',
    });
  }

  let body: SpinNotifyBody = {};
  try {
    body = event.body ? JSON.parse(event.body) as SpinNotifyBody : {};
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const geo = (body.geo ?? 'UNKNOWN').toString().toUpperCase().slice(0, 16);
  const country = (body.countryCode ?? '??').toString().toUpperCase().slice(0, 8);
  const label = (body.offerLabel ?? 'Unknown offer').toString().slice(0, 120);
  const offerId = (body.offerId ?? '—').toString().slice(0, 64);
  const campaign = body.campaignId != null ? `#${body.campaignId}` : '—';
  const source = (body.source ?? 'unknown').toString().slice(0, 32);

  const payload = {
    content: null,
    embeds: [
      {
        title: 'Wheel spin',
        description: `A player landed on **${label}**`,
        color: 0xff3d7f,
        fields: [
          { name: 'Country', value: country, inline: true },
          { name: 'Offer geo', value: geo, inline: true },
          { name: 'Campaign', value: campaign, inline: true },
          { name: 'Offer id', value: offerId, inline: true },
          { name: 'Wheel source', value: source, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Finger Challenge' },
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
