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
  campaign: '/api/mb-campaign',
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
  if (data.code === 'admin_not_configured' || (status === 503 && data.error?.includes('ADMIN_PASSWORD'))) {
    return data.hint
      ?? 'ADMIN_PASSWORD is not set on Netlify. Add it under Site settings → Environment variables, then redeploy.';
  }
  if (status === 401) {
    return 'Wrong admin password.';
  }
  return data.error ?? data.hint ?? 'Request failed';
}

function formatCountries(countries: string[] | undefined): string {
  if (!countries || countries.length === 0) {
    return 'countries unknown';
  }
  if (countries.length > 8) {
    return `${countries.slice(0, 8).join(', ')} +${countries.length - 8}`;
  }
  return countries.join(', ');
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function AdminOffers({ onExit }: AdminOffersProps) {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');
  const [activeGeo, setActiveGeo] = useState<OfferGeo>('US');
  const [listType, setListType] = useState('recentlyApproved');
  const [matchActiveGeo, setMatchActiveGeo] = useState(true);
  const [approvedOnly, setApprovedOnly] = useState(true);
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
  const [addingId, setAddingId] = useState<number | null>(null);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken('');
    setBootstrapping(false);
  }, []);

  const loadCampaigns = useCallback(async (
    authToken: string,
    list: string,
    geo: OfferGeo,
    matchGeo: boolean,
    onlyApproved: boolean,
  ) => {
    const params = new URLSearchParams({
      list,
      limit: '40',
      approvedOnly: onlyApproved ? '1' : '0',
    });
    if (matchGeo && geo !== 'FALLBACK') {
      params.set('geo', geo);
    }

    const response = await fetch(`${API.campaigns}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = (await response.json()) as {
      campaigns?: MbCampaignSummary[];
      scanned?: number;
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
    const nextScanned = data.scanned ?? (data.campaigns ?? []).length;
    return {
      campaigns: data.campaigns ?? [],
      scanned: nextScanned,
    };
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
        const loaded = await loadCampaigns(
          token,
          listType,
          activeGeo,
          matchActiveGeo,
          approvedOnly,
        );
        if (!cancelled) {
          const geoNote = matchActiveGeo && activeGeo !== 'FALLBACK' ? ` · ${activeGeo}` : '';
          const approvedNote = approvedOnly ? ' · approved' : '';
          setStatus(
            `Showing ${loaded.campaigns.length} of ${loaded.scanned} scanned`
            + ` (${listType}${geoNote}${approvedNote}).`,
          );
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
    // * Boot once per login; later refreshes are explicit.
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
    setStatus('Filtering MaxBounty catalog…');
    try {
      const loaded = await loadCampaigns(
        token,
        listType,
        activeGeo,
        matchActiveGeo,
        approvedOnly,
      );
      setStatus(
        `Showing ${loaded.campaigns.length} offers`
        + ` (scanned ${loaded.scanned} from “${listType}”)`
        + `${matchActiveGeo && activeGeo !== 'FALLBACK' ? ` · geo ${activeGeo}` : ' · all geos'}`
        + `${approvedOnly ? ' · approved to run' : ''}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Campaign fetch failed');
    } finally {
      setBusy(false);
    }
  };

  const addCampaign = async (campaign: MbCampaignSummary) => {
    if (!token) {
      return;
    }
    const current = draft[activeGeo];
    if (current.some((item) => item.campaignId === campaign.campaignId)) {
      setStatus(`#${campaign.campaignId} is already on the ${activeGeo} wheel.`);
      return;
    }
    if (current.length >= WHEEL_SLOT_COUNT) {
      setStatus(`Max ${WHEEL_SLOT_COUNT} offers per geo.`);
      return;
    }

    setAddingId(campaign.campaignId);
    setStatus(`Fetching tracking link for #${campaign.campaignId}…`);
    try {
      const response = await fetch(
        `${API.campaign}?id=${campaign.campaignId}&tracking=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await response.json()) as {
        campaign?: MbCampaignSummary & {
          rate?: number;
          trackingUrl?: string;
        };
        error?: string;
        hint?: string;
        code?: string;
      };
      if (response.status === 401 || data.code === 'admin_not_configured') {
        clearSession();
        throw new Error(authMessage(response.status, data));
      }
      if (!response.ok || !data.campaign) {
        throw new Error(authMessage(response.status, data));
      }

      const detail = data.campaign;
      setDraft((prev) => ({
        ...prev,
        [activeGeo]: [
          ...prev[activeGeo],
          {
            campaignId: detail.campaignId,
            name: detail.name,
            trackingUrl: detail.trackingUrl ?? '',
            rate: detail.rate ?? detail.defaultRate,
            rateType: detail.rateType,
            allowedCountries: detail.allowedCountries,
          },
        ],
      }));
      setStatus(
        detail.trackingUrl
          ? `Added #${detail.campaignId} to ${activeGeo} with tracking link ready. Save to persist.`
          : `Added #${detail.campaignId} to ${activeGeo}. Tracking link missing — try Save.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not add campaign');
    } finally {
      setAddingId(null);
    }
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

  const refreshTracking = async (campaignId: number) => {
    if (!token) {
      return;
    }
    setBusy(true);
    setStatus(`Refreshing tracking link for #${campaignId}…`);
    try {
      const response = await fetch(
        `${API.campaign}?id=${campaignId}&tracking=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await response.json()) as {
        campaign?: { trackingUrl?: string; name?: string; allowedCountries?: string[] };
        error?: string;
        code?: string;
        hint?: string;
      };
      if (!response.ok || !data.campaign?.trackingUrl) {
        throw new Error(authMessage(response.status, data));
      }
      setDraft((prev) => ({
        ...prev,
        [activeGeo]: prev[activeGeo].map((entry) => (
          entry.campaignId === campaignId
            ? {
                ...entry,
                trackingUrl: data.campaign!.trackingUrl!,
                allowedCountries: data.campaign!.allowedCountries ?? entry.allowedCountries,
              }
            : entry
        )),
      }));
      setStatus(`Tracking link refreshed for #${campaignId}. Save to persist.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Tracking refresh failed');
    } finally {
      setBusy(false);
    }
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
      setStatus('Saved. Tracking links refreshed for all geos — check the preview under each offer.');
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
            Filter the catalog by geo + approved-to-run, then add up to {WHEEL_SLOT_COUNT}
            {' '}campaigns per country. Tracking links are generated from MaxBounty when you add
            or save.
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
            onClick={() => {
              setActiveGeo(geo);
              if (token && matchActiveGeo) {
                setBusy(true);
                void loadCampaigns(token, listType, geo, true, approvedOnly)
                  .then((loaded) => {
                    setStatus(
                      `Showing ${loaded.campaigns.length} offers for ${geo}`
                      + ` (scanned ${loaded.scanned} from “${listType}”)`
                      + `${approvedOnly ? ' · approved to run' : ''}.`,
                    );
                  })
                  .catch((error: unknown) => {
                    setStatus(error instanceof Error ? error.message : 'Campaign fetch failed');
                  })
                  .finally(() => setBusy(false));
              }
            }}
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
              <option value="recentlyApproved">recentlyApproved</option>
              <option value="popular">popular</option>
              <option value="top">top</option>
              <option value="trending">trending</option>
              <option value="suggested">suggested</option>
              <option value="bookmarked">bookmarked</option>
              <option value="amPicks">amPicks</option>
              <option value="new">new</option>
            </select>
            <button type="button" onClick={() => void refreshCampaigns()} disabled={busy}>
              {busy ? 'Loading…' : 'Apply filters'}
            </button>
          </div>

          <div className={styles.filters}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={matchActiveGeo}
                onChange={(event) => setMatchActiveGeo(event.target.checked)}
              />
              Match active geo ({activeGeo === 'FALLBACK' ? 'all countries' : activeGeo})
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={approvedOnly}
                onChange={(event) => setApprovedOnly(event.target.checked)}
              />
              Approved to run only
            </label>
          </div>

          <ul className={styles.list}>
            {campaigns.length === 0 && (
              <li className={styles.empty}>
                No campaigns match these filters. Try another list or turn off a filter, then Apply.
              </li>
            )}
            {campaigns.map((campaign) => (
              <li key={campaign.campaignId} className={styles.catalogItem}>
                <div className={styles.selectedMeta}>
                  <strong>{campaign.name}</strong>
                  <small>
                    #{campaign.campaignId}
                    {campaign.defaultRate != null ? ` · ${campaign.defaultRate}` : ''}
                    {campaign.rateType ? ` ${campaign.rateType}` : ''}
                    {campaign.epc != null ? ` · EPC ${campaign.epc}` : ''}
                  </small>
                  <div className={styles.badges}>
                    <span className={styles.badge}>
                      {campaign.affiliateStatus || campaign.status || 'status ?'}
                    </span>
                    <span className={styles.badgeMuted}>
                      {formatCountries(campaign.allowedCountries)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void addCampaign(campaign)}
                  disabled={addingId === campaign.campaignId || busy}
                >
                  {addingId === campaign.campaignId ? 'Linking…' : `Add to ${activeGeo}`}
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
                    {item.allowedCountries?.length
                      ? ` · ${formatCountries(item.allowedCountries)}`
                      : ''}
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
                  <div className={styles.linkPreview}>
                    <span className={styles.linkLabel}>
                      {item.trackingUrl ? 'Tracking link' : 'Tracking link missing'}
                    </span>
                    {item.trackingUrl ? (
                      <a
                        className={styles.linkUrl}
                        href={item.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={item.trackingUrl}
                      >
                        {item.trackingUrl}
                      </a>
                    ) : (
                      <span className={styles.linkMissing}>
                        Add fetched a blank link — use Refresh link or Save.
                      </span>
                    )}
                    <div className={styles.linkActions}>
                      <button
                        type="button"
                        className={styles.ghost}
                        disabled={!item.trackingUrl}
                        onClick={() => {
                          void copyText(item.trackingUrl).then((ok) => {
                            setStatus(ok
                              ? `Copied tracking link for #${item.campaignId}.`
                              : 'Could not copy link.');
                          });
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className={styles.ghost}
                        disabled={busy}
                        onClick={() => void refreshTracking(item.campaignId)}
                      >
                        Refresh link
                      </button>
                    </div>
                  </div>
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
