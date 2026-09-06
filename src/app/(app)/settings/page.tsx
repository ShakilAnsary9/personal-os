'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { toast } from '@/components/Toast';
import { uid } from '@/lib/id';
import { todayKey } from '@/lib/dates';
import { PALETTE } from '@/lib/theme';
import { loadSampleData as loadSample } from '@/lib/sample-data';
import { getAdapter } from '@/lib/db';
import { isTrialExpired, getSubscriptionLabel } from '@/lib/gate';
import { Crown, X } from 'lucide-react';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const content = useStore((s) => s.content);
  const holdings = useStore((s) => s.holdings);
  const putTeam = useStore((s) => s.putTeam);
  const delTeam = useStore((s) => s.delTeam);
  const putProject = useStore((s) => s.putProject);
  const saveSettings = useStore((s) => s.saveSettings);
  const loadAll = useStore((s) => s.loadAll);
  const subscription = useStore((s) => s.subscription);

  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradeNote, setUpgradeNote] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgrade') === '1') {
      setUpgradeNote(true);
    }
  }, []);

  async function startUpgrade() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || 'Could not start checkout');
        setBillingLoading(false);
      }
    } catch {
      toast('Could not start checkout');
      setBillingLoading(false);
    }
  }

  const trialExpired = isTrialExpired(subscription);

  const [name, setName] = useState(settings.name);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamRole, setNewTeamRole] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [rate, setRate] = useState(String(settings.usdRate || 278));
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency || 'USD');

  const importRef = useRef<HTMLInputElement>(null);
  const pfpRef = useRef<HTMLInputElement>(null);

  function saveProfile() {
    const n = name.trim() || 'Ahsan Danish';
    saveSettings({ name: n });
    toast('Profile saved');
  }

  function saveRate() {
    const r = parseFloat(rate);
    if (!r || r <= 0) { toast('Enter a valid rate'); return; }
    saveSettings({ usdRate: r });
    toast(`Rate saved — USD now rolls in at ${r}`);
  }

  function saveCurrency() {
    saveSettings({ baseCurrency });
    toast(`Base currency set to ${baseCurrency}`);
  }

  function addTeam() {
    const n = newTeamName.trim();
    if (!n) { toast('Enter a name'); return; }
    const t = { id: uid(), created: Date.now(), name: n, role: newTeamRole.trim() || null, color: PALETTE[team.length % PALETTE.length] };
    putTeam(t);
    setNewTeamName('');
    setNewTeamRole('');
    toast(`Added ${n}`);
  }

  async function removeTeam(id: string) {
    const member = team.find((t) => t.id === id);
    const used = projects.filter((p) => p.assignee === id).length;
    if (!confirm(`Remove ${member?.name || 'this member'}?${used ? ` ${used} project(s) will become unassigned.` : ''}`)) return;
    delTeam(id);
    // Unassign projects
    for (const p of projects) {
      if (p.assignee === id) {
        await putProject({ ...p, assignee: null });
      }
    }
    toast('Removed');
  }

  function addToList(field: 'platforms' | 'stages' | 'markets', value: string, extra?: string) {
    const v = value.trim();
    if (!v) return;
    const list = settings[field] || [];
    if (list.includes(v)) { toast('Already there'); return; }
    saveSettings({ [field]: [...list, v] });
    toast(`${field === 'markets' ? 'Market' : field === 'stages' ? 'Stage' : 'Platform'} added`);
  }

  function removeFromList(field: 'platforms' | 'stages' | 'markets', index: number) {
    const list = [...(settings[field] || [])];
    if (field === 'stages' && list.length <= 2) { toast('Keep at least two stages'); return; }
    if (field === 'markets' && list.length <= 1) { toast('Keep at least one market'); return; }
    if (field === 'stages') {
      const stage = list[index];
      const used = content.filter((c) => c.stage === stage).length;
      if (used && !confirm(`${used} item(s) are in "${stage}". They will move to "${list[0]}". Continue?`)) return;
      list.splice(index, 1);
      // Move content from removed stage to first stage
      content.filter((c) => c.stage === stage).forEach((c) => {
        putProject({ ...c, stage: list[0] } as any);
      });
    } else if (field === 'markets') {
      const mk = list[index];
      const used = holdings.filter((h) => h.assetType === mk).length;
      if (used) { toast(`${used} holding(s) still use "${mk}" — remove them first`); return; }
      list.splice(index, 1);
    } else {
      list.splice(index, 1);
    }
    saveSettings({ [field]: list });
  }

  function handlePfpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 160;
        const cx = cv.getContext('2d')!;
        const s = Math.min(img.width, img.height);
        cx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 160, 160);
        saveSettings({ pfp: cv.toDataURL('image/webp', 0.85) });
        toast('Photo updated');
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
  }

  async function exportData() {
    const db = getAdapter();
    const dump: any = { app: 'ahsan-danish-os', version: 2, exported: new Date().toISOString(), data: {} };
    const stores = ['meta', 'tasks', 'habits', 'content', 'projects', 'inbox', 'team', 'money', 'holdings', 'loans', 'notes', 'reminders'] as const;
    for (const st of stores) {
      dump.data[st] = await db.getAll(st);
    }
    const blob = new Blob([JSON.stringify(dump)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ahsan-os-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    saveSettings({ lastBackup: Date.now() });
    toast('Backup downloaded');
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const dump = JSON.parse(r.result as string);
        if (dump.app !== 'ahsan-danish-os') throw 0;
        if (!confirm('Import this backup? It replaces everything currently in the app.')) return;
        const db = getAdapter();
        const stores = ['meta', 'tasks', 'habits', 'content', 'projects', 'inbox', 'team', 'money', 'holdings', 'loans', 'notes', 'reminders'] as const;
        for (const st of stores) {
          // Clear all existing items
          const existing = await db.getAll(st);
          for (const item of existing) await db.del(st, item.id);
          for (const o of dump.data[st] || []) await db.put(st, o);
        }
        await loadAll();
        toast('Backup imported');
      } catch {
        toast('Invalid backup file');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  }

  async function resetData() {
    if (!confirm('Reset to a clean slate? This erases all tasks, habits, content, projects and money. Export a backup first if unsure.')) return;
    if (!confirm('Really reset everything? This cannot be undone.')) return;
    const db = getAdapter();
    const stores = ['meta', 'tasks', 'habits', 'content', 'projects', 'inbox', 'team', 'money', 'holdings', 'loans', 'notes', 'reminders'] as const;
    for (const st of stores) {
      const existing = await db.getAll(st);
      for (const item of existing) await db.del(st, item.id);
    }
    await loadAll();
    toast('Reset to new — clean slate');
  }

  async function handleSampleData() {
    const hasData = useStore.getState().tasks.length || useStore.getState().projects.length || useStore.getState().content.length || useStore.getState().money.length || useStore.getState().habits.length;
    if (hasData && !confirm('Load sample data on top of what you have? It adds demo tasks, habits, content, projects and money entries.')) return;
    await loadSample();
    await loadAll();
    toast('Sample data loaded');
  }

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Press room</span>
            <h1 className="h-view">Settings</h1>
            <p className="sub">Profile, team, platforms, currency and your data.</p>
          </div>
        </div>

        <div className="set-grid">
          {/* Profile */}
          <div className="card set-card">
            <h3>Profile</h3>
            <p className="sub">Shown on the rail and morning masthead.</p>
            <div className="pfp-row">
              <img src={settings.pfp || undefined} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--ink)' }} />
              <div>
                <button className="btn small" onClick={() => pfpRef.current?.click()}>Change photo</button>
                <input ref={pfpRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePfpChange} />
              </div>
            </div>
            <div className="fld">
              <label>Display name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button className="btn" onClick={saveProfile}>Save profile</button>
          </div>

          {/* Team */}
          <div className="card set-card">
            <h3>Team</h3>
            <p className="sub">Add people once — then assign them to projects anywhere.</p>
            {team.map((t) => (
              <div key={t.id} className="addline" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.color, display: 'inline-block', textAlign: 'center', lineHeight: '24px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {(t.name || '?')[0]}
                </span>
                <span style={{ flex: 1 }}>{t.name}{t.role && <span className="tiny" style={{ color: 'var(--muted)' }}> · {t.role}</span>}</span>
                <button className="t-x" style={{ opacity: 1 }} onClick={() => removeTeam(t.id)}><X size={14} /></button>
              </div>
            ))}
            <div className="addline" style={{ marginTop: 12 }}>
              <input type="text" placeholder="Name… e.g. Awais" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
              <input type="text" placeholder="Role (optional)" style={{ maxWidth: 130 }} value={newTeamRole} onChange={(e) => setNewTeamRole(e.target.value)} />
              <button className="btn small" onClick={addTeam}>Add</button>
            </div>
          </div>

          {/* Platforms */}
          <div className="card set-card">
            <h3>Platforms</h3>
            <p className="sub">Tags on content cards and filters on the board.</p>
            <div className="tagrow">
              {(settings.platforms || []).map((p, i) => (
                <span key={i} className="chip" style={{ cursor: 'pointer' }} onClick={() => removeFromList('platforms', i)}>
                  {p} <span style={{ marginLeft: 4, opacity: 0.5 }}><X size={12} /></span>
                </span>
              ))}
            </div>
            <div className="addline" style={{ marginTop: 10 }}>
              <input type="text" placeholder="Add platform… e.g. LinkedIn" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addToList('platforms', newPlatform); setNewPlatform(''); } }} />
              <button className="btn small" onClick={() => { addToList('platforms', newPlatform); setNewPlatform(''); }}>Add</button>
            </div>
          </div>

          {/* Pipeline stages */}
          <div className="card set-card">
            <h3>Pipeline stages</h3>
            <p className="sub">Columns on the content board, in order.</p>
            <div className="tagrow">
              {(settings.stages || []).map((s, i) => (
                <span key={i} className="chip" style={{ cursor: 'pointer' }} onClick={() => removeFromList('stages', i)}>
                  {s} <span style={{ marginLeft: 4, opacity: 0.5 }}><X size={12} /></span>
                </span>
              ))}
            </div>
            <div className="addline" style={{ marginTop: 10 }}>
              <input type="text" placeholder="Add stage… e.g. Voiceover" value={newStage} onChange={(e) => setNewStage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addToList('stages', newStage); setNewStage(''); } }} />
              <button className="btn small" onClick={() => { addToList('stages', newStage); setNewStage(''); }}>Add</button>
            </div>
          </div>

          {/* Investment markets */}
          <div className="card set-card">
            <h3>Investment markets</h3>
            <p className="sub">Asset types you can pick when adding a holding — add Forex, Commodities, Real estate, anything.</p>
            <div className="tagrow">
              {(settings.markets || []).map((m, i) => (
                <span key={i} className="chip" style={{ cursor: 'pointer' }} onClick={() => removeFromList('markets', i)}>
                  {m} <span style={{ marginLeft: 4, opacity: 0.5 }}><X size={12} /></span>
                </span>
              ))}
            </div>
            <div className="addline" style={{ marginTop: 10 }}>
              <input type="text" placeholder="Add market… e.g. Forex" value={newMarket} onChange={(e) => setNewMarket(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addToList('markets', newMarket); setNewMarket(''); } }} />
              <button className="btn small" onClick={() => { addToList('markets', newMarket); setNewMarket(''); }}>Add</button>
            </div>
          </div>

          {/* Currency */}
          <div className="card set-card">
            <h3>Currency</h3>
            <p className="sub">Set your base currency — all money views will default to this.</p>
            <div className="fld">
              <label>Base currency</label>
              <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
              </select>
            </div>
            <button className="btn" onClick={saveCurrency}>Save currency</button>
            {baseCurrency !== 'USD' && (
              <>
                <hr className="rule" />
                <p className="sub">USD conversion rate for entries in dollars.</p>
                <div className="fld">
                  <label>1 USD = ? {baseCurrency}</label>
                  <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
                <button className="btn" onClick={saveRate}>Save rate</button>
              </>
            )}
          </div>

          {/* Plan / Billing */}
          <div className="card set-card">
            <h3>
              <Crown size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--gold)' }} />
              Plan &amp; billing
            </h3>
            {upgradeNote && (
              <p className="sub" style={{ color: 'var(--red)' }}>
                Money, Content, Projects, Notes and Reminders are Pro features.
                Upgrade to unlock them.
              </p>
            )}
            <p className="sub">
              You&apos;re on <b>{getSubscriptionLabel(subscription)}</b>.
            </p>
            {subscription?.plan === 'trial' && !trialExpired && (
              <p className="sub" style={{ color: 'var(--gold)' }}>
                Your 14-day Pro trial ends soon. After it expires, Pro features
                lock until you upgrade.
              </p>
            )}
            {subscription?.plan === 'trial' && trialExpired && (
              <p className="sub" style={{ color: 'var(--red)' }}>
                Your trial has ended. Pro features are locked — upgrade to keep
                using Money, Content, Projects, Notes and Reminders.
              </p>
            )}
            <p className="sub" style={{ marginBottom: 12 }}>
              Pro is <b>$5/month</b> and unlocks Money, Content, Projects,
              Notes and Reminders.
            </p>
            {subscription?.plan === 'pro' ? (
              <p className="sub">
                You have Pro. Payments are managed on Stripe.
              </p>
            ) : (
              <button className="btn" onClick={startUpgrade} disabled={billingLoading}>
                {billingLoading ? 'Opening checkout…' : 'Upgrade to Pro · $5/mo'}
              </button>
            )}
          </div>

          {/* Data */}
          <div className="card set-card">
            <h3>Your data</h3>
            <p className="sub">Everything lives in this browser (IndexedDB). Back up often — it's one JSON file.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={exportData}>Export backup</button>
              <button className="btn" onClick={() => importRef.current?.click()}>Import backup</button>
              <input ref={importRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importData} />
            </div>
            <hr className="rule" />
            <p className="sub" style={{ marginBottom: 10 }}>Kick the tyres with sample data, or wipe back to a clean slate to start fresh.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={handleSampleData}>Load sample data</button>
              <button className="btn ghost danger" onClick={resetData}>Reset to new</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
