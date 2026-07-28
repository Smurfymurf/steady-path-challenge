import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  OFFER_GEOS,
  WHEEL_SLOT_COUNT,
  type AssignedCampaign,
  type MbCampaignSummary,
  type OfferAssignments,
  type OfferGeo,
} from '../config/offerTypes';
import styles from './AdminOffers.module.css';

const SESSION_KEY = 'fc-admin-token';
const API = {
  offers: '/api/admin-offers',
  campaigns: '/api/mb-campaigns',
} as const;

interface AdminOffersProps {
  onExit: () => void;
}

function applyAssignments(
  data: OfferAssignments,
  setAssignments: (value: OfferAssignments) => void,
  setDraft: (value: Record<OfferGeo, AssignedCampaign[]>) => void,
) {
  setAssignments(data);
  setDraft({
    US: [...data.geos.US],
    GB: [...data.geos.GB],
    AU: [...data.geos.AU],
    NZ: [...data.geos.NZ],
    FALLBACK: [...data.geos.FALLBACK],
  });
}

function authMessage(status: number, data: { error?: string; hint?: string; code?: string }): string {
  if (data.code === 'admin_not_configured' || status === 503 && data.error?.includes('ADMIN_PASSWORD')) {
    return data.hint
      ?? 'ADMIN_PASSWORD is not set on Netlify. Add it under Site settings → Environment variables, then redeploy.';
  }
  if (status === 401) {
    return 'Wrong admin password.';
  }
  return data.error ?? data.hint ?? 'Request failed';
}

export function AdminOffers({ onExit }: AdminOffersProps) {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');
  const [activeGeo, setActiveGeo] = useState<OfferGeo>('US');
  const [listType, setListType] = useState('popular');
  const [campaigns, setCampaigns] = useState<MbCampaignSummary[]>([]);
  const [assignments, setAssignments] = useState<OfferAssignments | null>(null);
  const [draft, setDraft] = useState<Record<OfferGeo, AssignedCampaign[]>>({
    US: [],
    GB: [],
    AU: [],
    NZ: [],
    FALLBACK: [],
  });
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(sessionStorage.getItem(SESSION_KEY)));

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken('');
    setBootstrapping(false);
  }, []);

  const loadCampaigns = useCallback(async (authToken: string, list: string) => {
    const response = await fetch(
      `${API.campaigns}?list=${encodeURIComponent(list)}&limit=50`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    const data = (await response.json()) as {
      campaigns?: MbCampaignSummary[];
      error?: string;
      hint?: string;
      code?: string;
    };
    if (response.status === 401 || data.code === 'admin_not_configured') {
      clearSession();
      throw new Error(authMessage(response.status, data));
    }
    if (!response.ok) {
      throw new Error(authMessage(response.status, data));
    }
    setCampaigns(data.campaigns ?? []);
    return (data.campaigns ?? []).length;
  }, [clearSession]);

  const loadAssignments = useCallback(async (authToken: string) => {
    const response = await fetch(API.offers, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await response.json()) as {
      success?: boolean;
      configured?: boolean;
      assignments?: OfferAssignments;
      error?: string;
      hint?: string;
      code?: string;
    };
    if (response.status === 401 || data.code === 'admin_not_configured') {
      clearSession();
      throw new Error(authMessage(response.status, data));
    }
    if (!response.ok) {
      throw new Error(authMessage(response.status, data));
    }
    setConfigured(Boolean(data.configured));
    if (data.assignments) {
      applyAssignments(data.assignments, setAssignments, setDraft);
    }
  }, [clearSession]);

  // * Restore an existing session only after the server confirms the password.
  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    setBootstrapping(true);

    void (async () => {
      try {
        await loadAssignments(token);
        if (cancelled) {
          return;
        }
        const count = await loadCampaigns(token, listType);
        if (!cancelled) {
          setStatus(`Loaded ${count} campaigns (${listType}).`);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : 'Load failed');
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // * Intentionally omit listType — catalog refresh is manual / after login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loadAssignments, loadCampaigns]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const candidate = password.trim();
    if (!candidate || busy) {
      return;
    }

    setBusy(true);
    setStatus('Checking password…');
    try {
      const response = await fetch(API.offers, {
        headers: { Authorization: `Bearer ${candidate}` },
      });
      const data = (await response.json()) as {
        configured?: boolean;
        assignments?: OfferAssignments;
        error?: string;
        hint?: string;
        code?: string;
      };

      if (!response.ok) {
        setStatus(authMessage(response.status, data));
        return;
      }

      sessionStorage.setItem(SESSION_KEY, candidate);
      setConfigured(Boolean(data.configured));
      if (data.assignments) {
        applyAssignments(data.assignments, setAssignments, setDraft);
      }
      setPassword('');
      setToken(candidate);
      setStatus('Unlocked.');
    } catch {
      setStatus('Could not reach the admin API. Is the site deployed with Netlify functions?');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setStatus('');
  };

  const refreshCampaigns = async () => {
    if (!token) {
      return;
    }
    setBusy(true);
    setStatus('Loading MaxBounty campaigns…');
    try {
      const count = await loadCampaigns(token, listType);
      setStatus(`Loaded ${count} campaigns (${listType}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Campaign fetch failed');
    } finally {
      setBusy(false);
    }
  };

  const addCampaign = (campaign: MbCampaignSummary) => {
    setDraft((prev) => {
      const current = prev[activeGeo];
      if (current.some((item) => item.campaignId === campaign.campaignId)) {
        return prev;
      }
      if (current.length >= WHEEL_SLOT_COUNT) {
        setStatus(`Max ${WHEEL_SLOT_COUNT} offers per geo.`);
        return prev;
      }
      return {
        ...prev,
        [activeGeo]: [
          ...current,
          {
            campaignId: campaign.campaignId,
            name: campaign.name,
            trackingUrl: '',
            rate: campaign.defaultRate,
            rateType: campaign.rateType,
          },
        ],
      };
    });
  };

  const removeCampaign = (campaignId: number) => {
    setDraft((prev) => ({
      ...prev,
      [activeGeo]: prev[activeGeo].filter((item) => item.campaignId !== campaignId),
    }));
  };

  const moveCampaign = (campaignId: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const list = [...prev[activeGeo]];
      const index = list.findIndex((item) => item.campaignId === campaignId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= list.length) {
        return prev;
      }
      const swap = list[index]!;
      list[index] = list[nextIndex]!;
      list[nextIndex] = swap;
      return { ...prev, [activeGeo]: list };
    });
  };

  const save = async () => {
    if (!token) {
      return;
    }
    setBusy(true);
    setStatus('Saving + generating tracking links…');
    try {
      const response = await fetch(API.offers, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geos: Object.fromEntries(
            OFFER_GEOS.map((geo) => [
              geo,
              draft[geo].map((item) => ({
                campaignId: item.campaignId,
                label: item.label,
              })),
            ]),
          ),
        }),
      });
      const data = (await response.json()) as {
        assignments?: OfferAssignments;
        error?: string;
        hint?: string;
        code?: string;
      };
      if (response.status === 401 || data.code === 'admin_not_configured') {
        clearSession();
        throw new Error(authMessage(response.status, data));
      }
      if (!response.ok) {
        throw new Error(authMessage(response.status, data));
      }
      if (data.assignments) {
        applyAssignments(data.assignments, setAssignments, setDraft);
      }
      setStatus('Saved. Tracking links refreshed for all geos.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <main className={styles.shell}>
        <form className={styles.login} onSubmit={(event) => void handleLogin(event)}>
          <h1>Offer Admin</h1>
          <p>Enter the admin password to manage MaxBounty wheel offers by country.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
            disabled={busy}
          />
          <button type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Unlock'}
          </button>
          <button type="button" className={styles.ghost} onClick={onExit}>
            Back to game
          </button>
          {status && <p className={styles.status}>{status}</p>}
        </form>
      </main>
    );
  }

  if (bootstrapping) {
    return (
      <main className={styles.shell}>
        <p className={styles.status}>Loading admin…</p>
      </main>
    );
  }

  const selected = draft[activeGeo];

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1>MaxBounty Offers</h1>
          <p>
            Pick up to {WHEEL_SLOT_COUNT} campaigns per geo. FALLBACK is used when a
            country has no slots.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.ghost} onClick={onExit}>
            Game
          </button>
          <button type="button" className={styles.ghost} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {!configured && (
        <p className={styles.warn}>
          MaxBounty env vars are missing. Set MAXBOUNTY_EMAIL / MAXBOUNTY_PASSWORD /
          ADMIN_PASSWORD on Netlify.
        </p>
      )}

      <div className={styles.tabs}>
        {OFFER_GEOS.map((geo) => (
          <button
            key={geo}
            type="button"
            className={activeGeo === geo ? styles.tabActive : styles.tab}
            onClick={() => setActiveGeo(geo)}
          >
            {geo}
            <span>{draft[geo].length}/{WHEEL_SLOT_COUNT}</span>
          </button>
        ))}
      </div>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Catalog</h2>
            <select
              value={listType}
              onChange={(event) => setListType(event.target.value)}
            >
              <option value="popular">popular</option>
              <option value="top">top</option>
              <option value="trending">trending</option>
              <option value="suggested">suggested</option>
              <option value="bookmarked">bookmarked</option>
              <option value="amPicks">amPicks</option>
              <option value="new">new</option>
            </select>
            <button type="button" onClick={() => void refreshCampaigns()} disabled={busy}>
              Refresh
            </button>
          </div>
          <ul className={styles.list}>
            {campaigns.map((campaign) => (
              <li key={campaign.campaignId}>
                <div>
                  <strong>{campaign.name}</strong>
                  <small>
                    #{campaign.campaignId}
                    {campaign.defaultRate != null ? ` · ${campaign.defaultRate}` : ''}
                    {campaign.rateType ? ` ${campaign.rateType}` : ''}
                  </small>
                </div>
                <button type="button" onClick={() => addCampaign(campaign)}>
                  Add to {activeGeo}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{activeGeo} wheel</h2>
            <button type="button" onClick={() => void save()} disabled={busy}>
              Save all geos
            </button>
          </div>
          <ul className={styles.list}>
            {selected.length === 0 && (
              <li className={styles.empty}>No offers selected for {activeGeo}.</li>
            )}
            {selected.map((item) => (
              <li key={item.campaignId} className={styles.selectedItem}>
                <div className={styles.selectedMeta}>
                  <strong>{item.name}</strong>
                  <small>
                    #{item.campaignId}
                    {item.trackingUrl ? ' · link ready' : ' · link on save'}
                  </small>
                  <label className={styles.labelField}>
                    Wheel name
                    <input
                      type="text"
                      value={item.label ?? ''}
                      placeholder={item.name}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          [activeGeo]: prev[activeGeo].map((entry) => (
                            entry.campaignId === item.campaignId
                              ? { ...entry, label: value }
                              : entry
                          )),
                        }));
                      }}
                    />
                  </label>
                </div>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => moveCampaign(item.campaignId, -1)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moveCampaign(item.campaignId, 1)}>
                    ↓
                  </button>
                  <button type="button" onClick={() => removeCampaign(item.campaignId)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {assignments?.updatedAt && (
            <p className={styles.meta}>
              Last saved: {new Date(assignments.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      {status && <p className={styles.status}>{status}</p>}
    </main>
  );
}
