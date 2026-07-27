import {
  useCallback,
  useEffect,
  useMemo,
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

interface AdminOffersProps {
  onExit: () => void;
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

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token],
  );

  const loadAssignments = useCallback(async (authToken: string) => {
    const response = await fetch('/.netlify/functions/admin-offers', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      setToken('');
      throw new Error('Unauthorized');
    }
    const data = (await response.json()) as {
      success?: boolean;
      configured?: boolean;
      assignments?: OfferAssignments;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to load assignments');
    }
    setConfigured(Boolean(data.configured));
    if (data.assignments) {
      setAssignments(data.assignments);
      setDraft({
        US: [...data.assignments.geos.US],
        GB: [...data.assignments.geos.GB],
        AU: [...data.assignments.geos.AU],
        NZ: [...data.assignments.geos.NZ],
        FALLBACK: [...data.assignments.geos.FALLBACK],
      });
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    if (!token) {
      return;
    }
    setBusy(true);
    setStatus('Loading MaxBounty campaigns…');
    try {
      const response = await fetch(
        `/.netlify/functions/mb-campaigns?list=${encodeURIComponent(listType)}&limit=50`,
        { headers: authHeaders },
      );
      const data = (await response.json()) as {
        campaigns?: MbCampaignSummary[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Campaign fetch failed');
      }
      setCampaigns(data.campaigns ?? []);
      setStatus(`Loaded ${(data.campaigns ?? []).length} campaigns (${listType}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Campaign fetch failed');
    } finally {
      setBusy(false);
    }
  }, [authHeaders, listType, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadAssignments(token)
      .then(() => loadCampaigns())
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : 'Load failed');
      });
  }, [token, loadAssignments, loadCampaigns]);

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      return;
    }
    sessionStorage.setItem(SESSION_KEY, password.trim());
    setToken(password.trim());
    setPassword('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken('');
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
    setBusy(true);
    setStatus('Saving + generating tracking links…');
    try {
      const response = await fetch('/.netlify/functions/admin-offers', {
        method: 'PUT',
        headers: authHeaders,
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
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Save failed');
      }
      if (data.assignments) {
        setAssignments(data.assignments);
        setDraft({
          US: [...data.assignments.geos.US],
          GB: [...data.assignments.geos.GB],
          AU: [...data.assignments.geos.AU],
          NZ: [...data.assignments.geos.NZ],
          FALLBACK: [...data.assignments.geos.FALLBACK],
        });
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
        <form className={styles.login} onSubmit={handleLogin}>
          <h1>Offer Admin</h1>
          <p>Enter the admin password to manage MaxBounty wheel offers by country.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
          />
          <button type="submit">Unlock</button>
          <button type="button" className={styles.ghost} onClick={onExit}>
            Back to game
          </button>
        </form>
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
            <button type="button" onClick={() => void loadCampaigns()} disabled={busy}>
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
