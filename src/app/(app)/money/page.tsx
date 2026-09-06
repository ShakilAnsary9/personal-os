'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { Sparkline } from '@/components/Sparkline';
import { toast } from '@/components/Toast';
import { uid } from '@/lib/id';
import { Pencil, X, CircleDollarSign, TrendingUp, Wallet } from 'lucide-react';
import { todayKey, fmtShort, monthKey, MO, fromKey, dkey } from '@/lib/dates';
import { fmtMoney, holdingCalc, portfolioTotals, loanTotals, monthNet, templateMonthly } from '@/lib/money';
import { marketColor } from '@/lib/theme';
import type { MoneyEntry, Holding, Loan } from '@/types';

type MoneyTab = 'overview' | 'ledger' | 'invest' | 'loans' | 'recurring';

export default function MoneyPage() {
  const money = useStore((s) => s.money);
  const holdings = useStore((s) => s.holdings);
  const loans = useStore((s) => s.loans);
  const settings = useStore((s) => s.settings);
  const putMoney = useStore((s) => s.putMoney);
  const delMoney = useStore((s) => s.delMoney);
  const putHolding = useStore((s) => s.putHolding);
  const delHolding = useStore((s) => s.delHolding);
  const putLoan = useStore((s) => s.putLoan);
  const delLoan = useStore((s) => s.delLoan);
  const saveSettings = useStore((s) => s.saveSettings);

  const [tab, setTab] = useState<MoneyTab>('overview');
  const [modal, setModal] = useState(false);
  const [modalType, setModalType] = useState<'entry' | 'holding' | 'loan' | 'template'>('entry');
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') !== '1') return;
    const t = p.get('tab') as MoneyTab | null;
    if (t) setTab(t);
    if (t === 'invest') setTimeout(() => openAddHolding(), 0);
    else if (t === 'loans') setTimeout(() => openAddLoan(), 0);
    else setTimeout(() => openAdd(), 0);
  }, []);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  // Entry form
  const [entryForm, setEntryForm] = useState({ type: 'income' as 'income' | 'expense', amount: '', currency: 'PKR' as 'PKR' | 'USD', category: '', date: todayKey(), note: '' });
  // Holding form
  const [holdForm, setHoldForm] = useState({ assetType: settings.markets[0] || 'Stock', symbol: '', name: '', units: '', buyRate: '', currency: 'PKR' as 'PKR' | 'USD', curRate: '', buyUnknown: false, sipOn: false, sipAmt: '', sipCurrency: 'PKR' as 'PKR' | 'USD', sipDay: '1', dividends: '' });
  // Loan form
  const [loanForm, setLoanForm] = useState({ direction: 'given' as 'given' | 'taken', person: '', amount: '', currency: 'PKR' as 'PKR' | 'USD', due: '', note: '', repaid: '', status: 'outstanding' as 'outstanding' | 'settled' });
  // Template form
  const [tplForm, setTplForm] = useState({ type: 'income' as 'income' | 'expense', label: '', amount: '', currency: 'PKR' as 'PKR' | 'USD', freq: 'monthly' as 'monthly' | 'yearly', day: '1', autoLog: true });

  // Search/sort state
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerMonth, setLedgerMonth] = useState('all');
  const [investSearch, setInvestSearch] = useState('');
  const [investSort, setInvestSort] = useState('pl');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState('all');

  const mk = monthKey(todayKey());
  const mn = monthNet(mk, money);
  const pf = portfolioTotals(holdings);
  const lt = loanTotals(loans);

  /* ── KPIs ── */
  const kpis = [
    { cls: 'k-pine', label: 'This month income', val: fmtMoney(mn.inc, 'PKR'), sub: MO[fromKey(todayKey()).getMonth()] },
    { cls: 'k-red', label: 'This month expense', val: fmtMoney(mn.exp, 'PKR'), sub: `net ${mn.net >= 0 ? '+' : ''}${fmtMoney(mn.net, 'PKR')}` },
    { cls: 'k-gold', label: 'Portfolio value', val: fmtMoney(pf.cur, 'PKR'), sub: `${pf.pl >= 0 ? '▲ ' : '▼ '}${fmtMoney(pf.pl, 'PKR')} unreal.` },
    { cls: 'k-blue', label: 'Loans net', val: fmtMoney(lt.recv - lt.pay, 'PKR'), sub: `in ${fmtMoney(lt.recv, 'PKR')} · out ${fmtMoney(lt.pay, 'PKR')}` },
  ];

  /* ── Overview period ── */
  const [ovPeriod, setOvPeriod] = useState<'6mo' | 'year' | 'month'>('6mo');
  const [ovMonth, setOvMonth] = useState(todayKey().slice(0, 7));

  function last6Months() {
    const arr: string[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push(dkey(dd).slice(0, 7));
    }
    return arr;
  }

  function openAdd() {
    setEditId(null);
    setModalType('entry');
    setEntryForm({ type: 'income', amount: '', currency: 'PKR', category: '', date: todayKey(), note: '' });
    setModal(true);
  }

  function openEditEntry(m: MoneyEntry) {
    setEditId(m.id);
    setModalType('entry');
    setEntryForm({ type: m.type, amount: String(m.amount), currency: m.currency, category: m.category || '', date: m.date, note: m.note || '' });
    setModal(true);
  }

  function openEditHolding(h: Holding) {
    setEditId(h.id);
    setModalType('holding');
    setHoldForm({
      assetType: h.assetType,
      symbol: h.symbol,
      name: h.name || '',
      units: String(h.units),
      buyRate: String(h.buyRate),
      currency: h.currency,
      curRate: h.curRate != null ? String(h.curRate) : '',
      buyUnknown: h.buyUnknown,
      sipOn: !!h.sip,
      sipAmt: h.sip ? String(h.sip.amount) : '',
      sipCurrency: h.sip?.currency || 'PKR',
      sipDay: h.sip ? String(h.sip.day) : '1',
      dividends: h.dividends ? String(h.dividends) : '',
    });
    setModal(true);
  }

  function openEditLoan(l: Loan) {
    setEditId(l.id);
    setModalType('loan');
    setLoanForm({ direction: l.direction, person: l.person, amount: String(l.amount), currency: l.currency, due: l.due || '', note: l.note || '', repaid: l.repaid ? String(l.repaid) : '', status: l.status });
    setModal(true);
  }

  function openAddHolding() {
    setEditId(null);
    setModalType('holding');
    setHoldForm({ assetType: settings.markets[0] || 'Stock', symbol: '', name: '', units: '', buyRate: '', currency: 'PKR', curRate: '', buyUnknown: false, sipOn: false, sipAmt: '', sipCurrency: 'PKR', sipDay: '1', dividends: '' });
    setModal(true);
  }

  function openAddLoan() {
    setEditId(null);
    setModalType('loan');
    setLoanForm({ direction: 'given', person: '', amount: '', currency: 'PKR', due: '', note: '', repaid: '', status: 'outstanding' });
    setModal(true);
  }

  function openAddTemplate(kind: 'income' | 'expense') {
    setEditId(null);
    setModalType('template');
    setTplForm({ type: kind, label: '', amount: '', currency: 'PKR', freq: 'monthly', day: '1', autoLog: true });
    setModal(true);
  }

  function openEditTemplate(t: { id: string; type: string; label: string; amount: number; currency: string; freq: string; day: number; autoLog: boolean }) {
    setEditId(t.id);
    setModalType('template');
    setTplForm({ type: t.type as 'income' | 'expense', label: t.label, amount: String(t.amount), currency: t.currency as 'PKR' | 'USD', freq: t.freq as 'monthly' | 'yearly', day: String(t.day), autoLog: t.autoLog });
    setModal(true);
  }

  function saveEntry() {
    const amt = parseFloat(entryForm.amount);
    if (!amt || amt <= 0) { toast('Enter an amount'); return; }
    const m: MoneyEntry = editId
      ? { ...(money.find((x) => x.id === editId) as MoneyEntry) }
      : { id: uid(), created: Date.now(), type: 'income', amount: 0, currency: 'PKR', category: null, date: todayKey(), note: null };
    m.type = entryForm.type;
    m.amount = amt;
    m.currency = entryForm.currency;
    m.category = entryForm.category || null;
    m.date = entryForm.date || todayKey();
    m.note = entryForm.note || null;
    putMoney(m);
    toast(editId ? 'Saved' : 'Entry added');
    setModal(false);
  }

  function saveHolding() {
    const sym = holdForm.symbol.trim();
    const units = parseFloat(holdForm.units);
    const buy = parseFloat(holdForm.buyRate) || 0;
    if (!sym) { toast('Enter a symbol'); return; }
    if (!units) { toast('Enter units'); return; }
    const h: Holding = editId
      ? { ...(holdings.find((x) => x.id === editId) as Holding) }
      : { id: uid(), created: Date.now(), assetType: 'Stock', symbol: '', name: null, units: 0, buyRate: 0, currency: 'PKR', curRate: null, buyUnknown: false, dividends: 0, sip: null, sales: [] };
    h.assetType = holdForm.assetType;
    h.symbol = sym;
    h.name = holdForm.name || null;
    h.units = units;
    h.buyRate = buy;
    h.currency = holdForm.currency;
    h.curRate = holdForm.curRate ? parseFloat(holdForm.curRate) : null;
    h.buyUnknown = holdForm.buyUnknown;
    h.dividends = holdForm.dividends ? parseFloat(holdForm.dividends) : 0;
    if (holdForm.sipOn) {
      const amt = parseFloat(holdForm.sipAmt) || 0;
      if (amt > 0) {
        h.sip = { amount: amt, currency: holdForm.sipCurrency, day: parseInt(holdForm.sipDay) || 1, lastDone: h.sip?.lastDone || null };
      }
    } else {
      h.sip = null;
    }
    putHolding(h);
    toast(editId ? 'Saved' : 'Holding added');
    setModal(false);
  }

  function saveLoan() {
    const person = loanForm.person.trim();
    const amt = parseFloat(loanForm.amount);
    if (!person) { toast('Enter a name'); return; }
    if (!amt || amt <= 0) { toast('Enter an amount'); return; }
    const l: Loan = editId
      ? { ...(loans.find((x) => x.id === editId) as Loan) }
      : { id: uid(), created: Date.now(), direction: 'given', person: '', amount: 0, currency: 'PKR', due: null, note: null, repaid: 0, status: 'outstanding' };
    l.direction = loanForm.direction;
    l.person = person;
    l.amount = amt;
    l.currency = loanForm.currency;
    l.due = loanForm.due || null;
    l.note = loanForm.note || null;
    l.repaid = parseFloat(loanForm.repaid) || 0;
    l.status = loanForm.status;
    putLoan(l);
    toast(editId ? 'Saved' : 'Loan added');
    setModal(false);
  }

  function saveTemplate() {
    const label = tplForm.label.trim();
    const amt = parseFloat(tplForm.amount);
    if (!label) { toast('Add a label'); return; }
    if (!amt || amt <= 0) { toast('Enter an amount'); return; }
    const existing = (settings.templates || []).find((x) => x.id === editId);
    const t = {
      id: editId || uid(),
      type: tplForm.type,
      label,
      amount: amt,
      currency: tplForm.currency,
      freq: tplForm.freq,
      day: Math.min(31, Math.max(1, parseInt(tplForm.day) || 1)),
      autoLog: tplForm.autoLog,
      lastLogged: existing?.lastLogged || null,
    };
    const templates = [...(settings.templates || [])];
    if (editId) {
      const i = templates.findIndex((x) => x.id === editId);
      if (i >= 0) templates[i] = t;
    } else {
      templates.push(t);
    }
    saveSettings({ templates });
    toast(editId ? 'Saved' : 'Recurring item added');
    setModal(false);
  }

  function remove(type: string, id: string) {
    if (type === 'money') { delMoney(id); toast('Deleted'); }
    else if (type === 'holding') { delHolding(id); toast('Deleted'); }
    else if (type === 'loan') { delLoan(id); toast('Deleted'); }
    else if (type === 'template') {
      const templates = (settings.templates || []).filter((t) => t.id !== id);
      saveSettings({ templates });
      toast('Removed');
    }
    setConfirmDelete(null);
    setModal(false);
  }

  const modalTitle = modalType === 'entry'
    ? (editId ? 'Edit entry' : 'New income / expense')
    : modalType === 'holding'
    ? (editId ? 'Edit holding' : 'New investment')
    : modalType === 'loan'
    ? (editId ? 'Edit loan' : 'New loan')
    : (editId ? 'Edit recurring item' : 'New recurring item');

  return (
    <>
      <Appbar onAdd={openAdd} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Ledger &amp; portfolio</span>
            <h1 className="h-view">Money</h1>
            <p className="sub">Income, expenses, investments, loans</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { setModalType('holding'); openAddHolding(); }}>+ Add investment</button>
            <button className="btn primary" onClick={openAdd}>+ Add</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpis">
          {kpis.map((k, i) => (
            <div key={i} className={`kpi ${k.cls}`}>
              <div className="tag-corner" />
              <div className="kl">{k.label}</div>
              <div className="kv">{k.val}</div>
              <div className="ksub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Subtabs */}
        <div className="subtabs" id="moneySubtabs">
          {(['overview', 'ledger', 'invest', 'loans', 'recurring'] as MoneyTab[]).map((t) => (
            <button key={t} className={`subtab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)} data-t={t}>
              {t === 'invest' ? 'Investments' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && <OverviewTab ovPeriod={ovPeriod} setOvPeriod={setOvPeriod} ovMonth={ovMonth} setOvMonth={setOvMonth} money={money} holdings={holdings} loans={loans} settings={settings} />}

        {/* ── LEDGER ── */}
        {tab === 'ledger' && (
          <LedgerTab money={money} search={ledgerSearch} setSearch={setLedgerSearch} month={ledgerMonth} setMonth={setLedgerMonth} onEdit={openEditEntry} onDelete={(id: string) => setConfirmDelete({ type: 'money', id })} />
        )}

        {/* ── INVESTMENTS ── */}
        {tab === 'invest' && (
          <InvestTab holdings={holdings} settings={settings} search={investSearch} setSearch={setInvestSearch} sort={investSort} setSort={setInvestSort} onEdit={openEditHolding} onDelete={(id: string) => setConfirmDelete({ type: 'holding', id })} />
        )}

        {/* ── LOANS ── */}
        {tab === 'loans' && (
          <LoansTab loans={loans} search={loanSearch} setSearch={setLoanSearch} filter={loanFilter} setFilter={setLoanFilter} onEdit={openEditLoan} onDelete={(id: string) => setConfirmDelete({ type: 'loan', id })} />
        )}

        {/* ── RECURRING ── */}
        {tab === 'recurring' && (
          <RecurringTab settings={settings} onAdd={openAddTemplate} onEdit={openEditTemplate} onDelete={(id: string) => setConfirmDelete({ type: 'template', id })} onLogNow={(id: string) => { toast('Logged to ledger'); }} />
        )}
      </section>

      {/* ── Modals ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={modalTitle} wide
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {editId && <button className="btn danger" onClick={() => confirmDelete ? null : setConfirmDelete({ type: modalType === 'entry' ? 'money' : modalType === 'holding' ? 'holding' : modalType === 'loan' ? 'loan' : 'template', id: editId })}>Delete</button>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn primary" onClick={modalType === 'entry' ? saveEntry : modalType === 'holding' ? saveHolding : modalType === 'loan' ? saveLoan : saveTemplate}>Save</button>
            </div>
          </div>
        }>
        {modalType === 'entry' && (
          <>
            <div className="fld"><label>Type</label><div className="seg">
              {(['income', 'expense'] as const).map((t) => <button key={t} className={entryForm.type === t ? 'on' : ''} onClick={() => setEntryForm({ ...entryForm, type: t })}>{t}</button>)}
            </div></div>
            <div className="frow">
              <div className="fld"><label>Amount</label><input type="number" value={entryForm.amount} onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })} placeholder="0" /></div>
              <div className="fld"><label>Currency</label><div className="seg">
                {(['PKR', 'USD'] as const).map((c) => <button key={c} className={entryForm.currency === c ? 'on' : ''} onClick={() => setEntryForm({ ...entryForm, currency: c })}>{c}</button>)}
              </div></div>
            </div>
            <div className="frow">
              <div className="fld"><label>Category</label><input value={entryForm.category} onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })} placeholder="Freelance, AdSense…" /></div>
              <div className="fld"><label>Date</label><input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} /></div>
            </div>
            <div className="fld"><label>Note</label><input value={entryForm.note} onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })} placeholder="Optional" /></div>
          </>
        )}
        {modalType === 'holding' && (
          <>
            <div className="fld"><label>Market / asset type</label><div className="seg">
              {(settings.markets || ['Stock']).map((m) => <button key={m} className={holdForm.assetType === m ? 'on' : ''} onClick={() => setHoldForm({ ...holdForm, assetType: m })}>{m}</button>)}
            </div></div>
            <div className="frow">
              <div className="fld"><label>Symbol / ticker</label><input value={holdForm.symbol} onChange={(e) => setHoldForm({ ...holdForm, symbol: e.target.value })} placeholder="MEBL, BTC" /></div>
              <div className="fld"><label>Full name</label><input value={holdForm.name} onChange={(e) => setHoldForm({ ...holdForm, name: e.target.value })} placeholder="Meezan Bank" /></div>
            </div>
            <div className="frow">
              <div className="fld"><label>Units</label><input type="number" value={holdForm.units} onChange={(e) => setHoldForm({ ...holdForm, units: e.target.value })} /></div>
              <div className="fld"><label>Buy rate / unit</label><input type="number" value={holdForm.buyRate} onChange={(e) => setHoldForm({ ...holdForm, buyRate: e.target.value })} /></div>
              <div className="fld"><label>Currency</label><div className="seg">
                {(['PKR', 'USD'] as const).map((c) => <button key={c} className={holdForm.currency === c ? 'on' : ''} onClick={() => setHoldForm({ ...holdForm, currency: c })}>{c}</button>)}
              </div></div>
            </div>
            <div className="fld"><label>Current rate / unit</label><input type="number" value={holdForm.curRate} onChange={(e) => setHoldForm({ ...holdForm, curRate: e.target.value })} placeholder="market rate" /></div>
            <div className="fld"><label>Dividends / profit received</label><input type="number" value={holdForm.dividends} onChange={(e) => setHoldForm({ ...holdForm, dividends: e.target.value })} placeholder="cash payouts to date" /></div>
          </>
        )}
        {modalType === 'loan' && (
          <>
            <div className="fld"><label>Direction</label><div className="seg">
              {(['given', 'taken'] as const).map((d) => <button key={d} className={loanForm.direction === d ? 'on' : ''} onClick={() => setLoanForm({ ...loanForm, direction: d })}>{d === 'given' ? 'I gave' : 'I took'}</button>)}
            </div></div>
            <div className="fld"><label>Person name</label><input value={loanForm.person} onChange={(e) => setLoanForm({ ...loanForm, person: e.target.value })} placeholder="Any name" /></div>
            <div className="frow">
              <div className="fld"><label>Amount</label><input type="number" value={loanForm.amount} onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })} /></div>
              <div className="fld"><label>Currency</label><div className="seg">
                {(['PKR', 'USD'] as const).map((c) => <button key={c} className={loanForm.currency === c ? 'on' : ''} onClick={() => setLoanForm({ ...loanForm, currency: c })}>{c}</button>)}
              </div></div>
              <div className="fld"><label>Due</label><input type="date" value={loanForm.due} onChange={(e) => setLoanForm({ ...loanForm, due: e.target.value })} /></div>
            </div>
            <div className="fld"><label>Purpose / note</label><input value={loanForm.note} onChange={(e) => setLoanForm({ ...loanForm, note: e.target.value })} placeholder="Why" /></div>
            <div className="frow">
              <div className="fld"><label>Repaid so far</label><input type="number" value={loanForm.repaid} onChange={(e) => setLoanForm({ ...loanForm, repaid: e.target.value })} /></div>
              <div className="fld"><label>Status</label><div className="seg">
                {(['outstanding', 'settled'] as const).map((s) => <button key={s} className={loanForm.status === s ? 'on' : ''} onClick={() => setLoanForm({ ...loanForm, status: s })}>{s}</button>)}
              </div></div>
            </div>
          </>
        )}
        {modalType === 'template' && (
          <>
            <div className="fld"><label>Type</label><div className="seg">
              {(['income', 'expense'] as const).map((t) => <button key={t} className={tplForm.type === t ? 'on' : ''} onClick={() => setTplForm({ ...tplForm, type: t })}>{t}</button>)}
            </div></div>
            <div className="fld"><label>Label</label><input value={tplForm.label} onChange={(e) => setTplForm({ ...tplForm, label: e.target.value })} placeholder="Salary, rent, hosting…" /></div>
            <div className="frow">
              <div className="fld"><label>Amount</label><input type="number" value={tplForm.amount} onChange={(e) => setTplForm({ ...tplForm, amount: e.target.value })} /></div>
              <div className="fld"><label>Currency</label><div className="seg">
                {(['PKR', 'USD'] as const).map((c) => <button key={c} className={tplForm.currency === c ? 'on' : ''} onClick={() => setTplForm({ ...tplForm, currency: c })}>{c}</button>)}
              </div></div>
              <div className="fld"><label>Frequency</label><div className="seg">
                {(['monthly', 'yearly'] as const).map((f) => <button key={f} className={tplForm.freq === f ? 'on' : ''} onClick={() => setTplForm({ ...tplForm, freq: f })}>{f}</button>)}
              </div></div>
            </div>
            <div className="fld"><label>Day of month</label><input type="number" min={1} max={31} value={tplForm.day} onChange={(e) => setTplForm({ ...tplForm, day: e.target.value })} /></div>
          </>
        )}
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete?"
        footer={<button className="btn danger" onClick={() => confirmDelete && remove(confirmDelete.type, confirmDelete.id)}>Delete</button>}>
        <p className="sub">This cannot be undone.</p>
      </Modal>
    </>
  );
}

/* ── Overview subtab ── */
function OverviewTab({ ovPeriod, setOvPeriod, ovMonth, setOvMonth, money, holdings, loans, settings }: any) {
  const pf = portfolioTotals(holdings);
  const lt = loanTotals(loans);
  const tpl = templateMonthly(settings.templates || []);

  function last6Months() {
    const arr: string[] = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push(dkey(dd).slice(0, 7));
    }
    return arr;
  }

  let barData: Array<{ l: string; v: number; color: string }> = [];
  let headline = '';
  let subline = '';
  let hInc = 0, hExp = 0;

  if (ovPeriod === 'month') {
    const n = monthNet(ovMonth, money);
    hInc = n.inc;
    hExp = n.exp;
    const [y, m] = ovMonth.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    for (let day = 1; day <= dim; day += Math.ceil(dim / 12)) {
      const upto = dkey(new Date(y, m - 1, day));
      let net = 0;
      money.forEach((mm: any) => {
        if (mm.date.slice(0, 7) === ovMonth && mm.date <= upto) {
          net += mm.type === 'income' ? mm.amount : -mm.amount;
        }
      });
      barData.push({ l: String(day), v: Math.round(net), color: net < 0 ? 'var(--neg)' : 'var(--pine)' });
    }
    headline = MO[m - 1] + ' ' + y;
    subline = 'Cumulative net through the month';
  } else if (ovPeriod === 'year') {
    const y = new Date().getFullYear();
    for (let mo = 0; mo < 12; mo++) {
      const mk2 = y + '-' + String(mo + 1).padStart(2, '0');
      const n = monthNet(mk2, money);
      hInc += n.inc;
      hExp += n.exp;
      barData.push({ l: MO[mo].slice(0, 1), v: Math.round(n.net), color: n.net < 0 ? 'var(--neg)' : 'var(--pine)' });
    }
    headline = String(y);
    subline = 'Net by month this year';
  } else {
    const months = last6Months();
    months.forEach((mk2) => {
      const n = monthNet(mk2, money);
      hInc += n.inc;
      hExp += n.exp;
      barData.push({ l: MO[+mk2.slice(5, 7) - 1], v: Math.round(n.net), color: n.net < 0 ? 'var(--neg)' : 'var(--pine)' });
    });
    headline = 'Last 6 months';
    subline = 'Income minus expenses, per month';
  }
  const hNet = hInc - hExp;

  const alloc: Record<string, number> = {};
  holdings.forEach((h: any) => {
    const c = holdingCalc(h);
    alloc[h.assetType] = (alloc[h.assetType] || 0) + c.cur;
  });
  const donutData = Object.entries(alloc).filter(([, v]) => v > 0).map(([k, v]) => ({ label: k, v, color: marketColor(k, false, settings.markets) }));

  return (
    <div>
      <div className="period-bar">
        <div className="vtoggle">
          <button className={ovPeriod === '6mo' ? 'on' : ''} onClick={() => setOvPeriod('6mo')}>Last 6 months</button>
          <button className={ovPeriod === 'year' ? 'on' : ''} onClick={() => setOvPeriod('year')}>This year</button>
          <button className={ovPeriod === 'month' ? 'on' : ''} onClick={() => setOvPeriod('month')}>By month</button>
        </div>
      </div>
      <div className="money-grid">
        <div className="card chartcard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div><h3>Net — {headline}</h3><p className="sub">{subline}</p></div>
            <div style={{ textAlign: 'right' }}>
              <div className={hNet >= 0 ? 'pos' : 'neg'} style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{fmtMoney(hNet, 'PKR')}</div>
              <div className="tiny mono" style={{ color: 'var(--muted)' }}>in {fmtMoney(hInc, 'PKR')} · out {fmtMoney(hExp, 'PKR')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, marginTop: 12 }}>
            {barData.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span className="tiny mono">{b.v !== 0 ? fmtMoney(b.v, 'PKR') : ''}</span>
                <div style={{ width: '100%', height: Math.max(4, Math.abs(b.v) / (Math.max(...barData.map((x) => Math.abs(x.v))) || 1) * 140), background: b.color, borderRadius: 2 }} />
                <span className="tiny mono" style={{ color: 'var(--muted)' }}>{b.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card chartcard">
          <h3>Portfolio mix</h3>
          <p className="sub">Current value by asset type.</p>
          {donutData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 12 }}>
              <div style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(${donutData.map((d, i) => {
                const start = donutData.slice(0, i).reduce((s, x) => s + (x.v / donutData.reduce((a, b) => a + b.v, 0)) * 360, 0);
                const pct = (d.v / donutData.reduce((a, b) => a + b.v, 0)) * 360;
                return `${d.color} ${start}deg ${start + pct}deg`;
              }).join(', ')})` }} />
              <div className="legend" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                {donutData.map((d, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                    {d.label} — {fmtMoney(d.v, 'PKR')}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} label="no holdings yet" message="Add an investment in the Investments tab." />
          )}
        </div>
      </div>
      <div className="money-grid" style={{ marginTop: 18 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <b style={{ fontWeight: 800 }}>Net position</b>
          <p className="tiny" style={{ marginTop: 6 }}>Portfolio value plus money owed to you, minus money you owe.</p>
          <div style={{ fontWeight: 800, fontSize: 30, marginTop: 8, letterSpacing: '-.02em' }}>{fmtMoney(pf.cur + lt.recv - lt.pay, 'PKR')}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <b style={{ fontWeight: 800 }}>Recurring / month</b>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <div><div className="pos" style={{ fontWeight: 800, fontSize: 22 }}>{fmtMoney(tpl.inc, 'PKR')}</div><div className="tiny mono" style={{ color: 'var(--muted)' }}>income in</div></div>
            <div><div className="neg" style={{ fontWeight: 800, fontSize: 22 }}>{fmtMoney(tpl.exp, 'PKR')}</div><div className="tiny mono" style={{ color: 'var(--muted)' }}>expenses out</div></div>
            <div><div style={{ fontWeight: 800, fontSize: 22 }} className={tpl.net >= 0 ? 'pos' : 'neg'}>{fmtMoney(tpl.net, 'PKR')}</div><div className="tiny mono" style={{ color: 'var(--muted)' }}>net recurring</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ledger subtab ── */
function LedgerTab({ money, search, setSearch, month, setMonth, onEdit, onDelete }: any) {
  const months: string[] = [...new Set<string>(money.map((m: any) => monthKey(m.date)))].sort().reverse();
  let rows = [...money].sort((a: any, b: any) => (b.date < a.date ? -1 : 1));
  if (month !== 'all') rows = rows.filter((m: any) => monthKey(m.date) === month);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((m: any) => [m.category, m.note, m.type, m.currency].some((f: any) => (f || '').toLowerCase().includes(q)));
  }
  const inc = rows.filter((m: any) => m.type === 'income').reduce((s: number, m: any) => s + m.amount, 0);
  const exp = rows.filter((m: any) => m.type === 'expense').reduce((s: number, m: any) => s + m.amount, 0);

  return (
    <div>
      <div className="proj-controls">
        <input type="text" className="searchbar" placeholder="Search ledger — category, note…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="sortsel" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">All months</option>
          {months.map((mk: string) => (
            <option key={mk} value={mk}>{MO[+mk.slice(5, 7) - 1]} {mk.slice(0, 4)}</option>
          ))}
        </select>
      </div>
      <div className="card" style={{ padding: '6px 4px', overflowX: 'auto' }}>
        <table className="ledger">
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Note</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((m: any) => (
              <tr key={m.id}>
                <td className="mono tiny">{fmtShort(m.date)}</td>
                <td><span className={`chip ${m.type === 'income' ? 'pine' : 'red'}`}>{m.type}</span></td>
                <td>{m.category || '\u2014'}</td>
                <td className="tiny">{m.note || ''}</td>
                <td className={`amt ${m.type === 'income' ? 'pos' : 'neg'}`}>
                  {m.type === 'income' ? '+' : '\u2212'}{fmtMoney(m.amount, m.currency)}
                  <div className="tiny" style={{ color: 'var(--muted)' }}>{m.currency}</div>
                </td>
                <td className="rowact">
                  <button onClick={() => onEdit(m)}><Pencil size={14} /></button>
                  <button onClick={() => onDelete(m.id)}><X size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6}>            <EmptyState icon={CircleDollarSign} label="ledger empty" message="Log your first income or expense with + Add." /></td></tr>
            )}
            {rows.length > 0 && (
              <tr style={{ borderTop: '1.5px solid var(--ink)' }}>
                <td colSpan={4} className="mono tiny" style={{ textAlign: 'right', paddingTop: 10 }}>SHOWN TOTAL</td>
                <td className="amt" style={{ paddingTop: 10 }}>
                  <span className="pos">+{fmtMoney(inc, 'PKR')}</span><br />
                  <span className="neg">{'\u2212'}{fmtMoney(exp, 'PKR')}</span><br />
                  <b>{fmtMoney(inc - exp, 'PKR')}</b>
                </td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Investments subtab ── */
function InvestTab({ holdings, settings, search, setSearch, sort, setSort, onEdit, onDelete }: any) {
  const pf = portfolioTotals(holdings);
  let rows = [...holdings];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((h: any) => [h.symbol, h.name, h.assetType, h.currency].some((f: any) => (f || '').toLowerCase().includes(q)));
  }
  const sorters: Record<string, (a: any, b: any) => number> = {
    pl: (a, b) => holdingCalc(b).pl - holdingCalc(a).pl,
    plpct: (a, b) => holdingCalc(b).plpct - holdingCalc(a).plpct,
    value: (a, b) => holdingCalc(b).cur - holdingCalc(a).cur,
    invested: (a, b) => holdingCalc(b).inv - holdingCalc(a).inv,
    symbol: (a, b) => (a.symbol || '').localeCompare(b.symbol || ''),
  };
  rows.sort(sorters[sort] || sorters.pl);

  const sipList = holdings.filter((h: any) => h.sip);

  return (
    <div>
      {holdings.length > 0 && (
        <div className="kpis" style={{ marginBottom: 16 }}>
          <div className="kpi"><div className="kl">Unrealized P/L</div><div className={`kv ${pf.pl >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 21 }}>{pf.pl >= 0 ? '+' : '\u2212'}{fmtMoney(pf.pl, 'PKR')}</div><div className="ksub tiny">on current holdings</div></div>
          <div className="kpi"><div className="kl">Dividends / profit</div><div className="kv" style={{ fontSize: 21 }}>{fmtMoney(pf.div, 'PKR')}</div><div className="ksub tiny">cash received</div></div>
          <div className="kpi"><div className="kl">Realized P/L</div><div className={`kv ${pf.realized >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 21 }}>{pf.realized >= 0 ? '+' : '\u2212'}{fmtMoney(pf.realized, 'PKR')}</div><div className="ksub tiny">from booked sales</div></div>
          <div className="kpi k-pine"><div className="tag-corner" /><div className="kl">Total return</div><div className="kv" style={{ fontSize: 21 }}>{fmtMoney(pf.pl + pf.div + pf.realized, 'PKR')}</div><div className="ksub tiny">unreal. + div + realized</div></div>
        </div>
      )}
      <div className="proj-controls">
        <input type="text" className="searchbar" placeholder="Search investments…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="pl">Sort: P/L</option>
          <option value="plpct">Sort: P/L %</option>
          <option value="value">Sort: current value</option>
          <option value="invested">Sort: invested</option>
          <option value="symbol">Sort: symbol</option>
        </select>
      </div>
      {sipList.length > 0 && (
        <div className="card" style={{ padding: '11px 15px', marginBottom: 14, borderColor: 'var(--plum)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="chip plum">SIP</span>
            {sipList.map((h: any) => (
              <span key={h.id} className="tiny" style={{ color: 'var(--ink2)' }}>
                <b>{h.symbol || h.name}</b> {fmtMoney(h.sip.amount, h.sip.currency)} · day {h.sip.day}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="card" style={{ padding: '6px 4px', overflowX: 'auto' }}>
        <table className="ledger">
          <thead><tr><th>Asset</th><th>Market</th><th style={{ textAlign: 'right' }}>Units</th><th style={{ textAlign: 'right' }}>Buy rate</th><th style={{ textAlign: 'right' }}>Invested</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>P / L</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((h: any) => {
              const c = holdingCalc(h);
              const cls = c.pl >= 0 ? 'pos' : 'neg';
              return (
                <tr key={h.id}>
                  <td><b>{h.symbol || h.name}</b>{h.name && h.symbol && <div className="tiny">{h.name}</div>}</td>
                  <td><span className="chip" style={{ borderColor: marketColor(h.assetType, false, settings.markets), background: marketColor(h.assetType, true, settings.markets) }}>{h.assetType}</span></td>
                  <td className="amt">{h.units}</td>
                  <td className="amt">{h.buyRate} <span className="tiny">{h.currency}</span></td>
                  <td className="amt">{fmtMoney(c.inv, 'PKR')}</td>
                  <td className="amt">{h.curRate != null ? <>{fmtMoney(c.cur, 'PKR')}<div className="tiny">@{h.curRate}</div></> : <span className="tiny">set rate</span>}</td>
                  <td className={`amt hold-pl ${cls}`}>{(c.pl >= 0 ? '+' : '\u2212') + fmtMoney(c.pl, 'PKR')}<div className={`tiny ${cls}`}>{c.plpct >= 0 ? '+' : ''}{c.plpct.toFixed(1)}%</div></td>
                  <td className="rowact"><button onClick={() => onEdit(h)}><Pencil size={14} /></button><button onClick={() => onDelete(h.id)}><X size={14} /></button></td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8}><EmptyState icon={CircleDollarSign} label="no investments" message="Add a stock, mutual fund, crypto or any market." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Loans subtab ── */
function LoansTab({ loans, search, setSearch, filter, setFilter, onEdit, onDelete }: any) {
  let all = [...loans];
  if (filter === 'given') all = all.filter((l: any) => l.direction === 'given');
  else if (filter === 'taken') all = all.filter((l: any) => l.direction === 'taken');
  else if (filter === 'open') all = all.filter((l: any) => l.status !== 'settled');
  else if (filter === 'settled') all = all.filter((l: any) => l.status === 'settled');
  if (search) {
    const q = search.toLowerCase();
    all = all.filter((l: any) => [l.person, l.note, l.direction, l.currency].some((f: any) => (f || '').toLowerCase().includes(q)));
  }
  const active = all.filter((l: any) => l.status !== 'settled');
  const settled = all.filter((l: any) => l.status === 'settled');

  function row(l: any) {
    const bal = l.amount - (l.repaid || 0);
    const given = l.direction === 'given';
    return (
      <tr key={l.id}>
        <td><span className={`chip ${given ? 'pine' : 'red'}`}>{given ? 'I gave' : 'I took'}</span></td>
        <td><b>{l.person}</b></td>
        <td className="tiny">{l.note || ''}{l.due && <div className="mono tiny">due {fmtShort(l.due)}</div>}</td>
        <td className="amt">{fmtMoney(l.amount, l.currency)} <span className="tiny">{l.currency}</span></td>
        <td className="amt">{l.status === 'settled' ? <span className="chip pine">settled</span> : `${fmtMoney(bal, 'PKR')} left`}</td>
        <td className="rowact"><button onClick={() => onEdit(l)}><Pencil size={14} /></button><button onClick={() => onDelete(l.id)}><X size={14} /></button></td>
      </tr>
    );
  }

  return (
    <div>
      <div className="proj-controls">
        <input type="text" className="searchbar" placeholder="Search loans — person, purpose…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="sortsel" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All loans</option>
          <option value="open">Open only</option>
          <option value="given">I gave</option>
          <option value="taken">I took</option>
          <option value="settled">Settled</option>
        </select>
      </div>
      <div className="card" style={{ padding: '6px 4px', overflowX: 'auto', marginBottom: 16 }}>
        <table className="ledger">
          <thead><tr><th>Direction</th><th>Person</th><th>Purpose</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Balance</th><th></th></tr></thead>
          <tbody>
            {active.length ? active.map(row) : <tr>          <td colSpan={6}><EmptyState icon={CircleDollarSign} label="no open loans" message="Record money you gave or took." /></td></tr>}
          </tbody>
        </table>
      </div>
      {settled.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Settled</h3>
          <div className="card" style={{ padding: '6px 4px', overflowX: 'auto' }}>
            <table className="ledger"><tbody>{settled.map(row)}</tbody></table>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Recurring subtab ── */
function RecurringTab({ settings, onAdd, onEdit, onDelete, onLogNow }: any) {
  const tpl = templateMonthly(settings.templates || []);
  const list = settings.templates || [];
  const income = list.filter((t: any) => t.type === 'income');
  const expense = list.filter((t: any) => t.type === 'expense');

  function itemRow(t: any) {
    return (
      <div key={t.id} className="rec-row">
        <div className="rec-main">
          <div className="rec-label">{t.label}</div>
          <div className="rec-meta"><span className="mono">{t.freq} · day {t.day}</span></div>
        </div>
        <div className={`rec-amt ${t.type === 'income' ? 'pos' : 'neg'}`}>
          {t.type === 'income' ? '+' : '\u2212'}{fmtMoney(t.amount, t.currency)}
        </div>
        <div className="rec-act">
          <button className="t-x" style={{ opacity: 1 }} onClick={() => onEdit(t)}><Pencil size={14} /></button>
          <button className="t-x" style={{ opacity: 1 }} onClick={() => onDelete(t.id)}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="kpis" style={{ marginBottom: 20 }}>
        <div className="kpi k-pine"><div className="tag-corner" /><div className="kl">Recurring income / mo</div><div className="kv pos" style={{ fontSize: 23 }}>{fmtMoney(tpl.inc, 'PKR')}</div></div>
        <div className="kpi k-red"><div className="tag-corner" /><div className="kl">Recurring expense / mo</div><div className="kv neg" style={{ fontSize: 23 }}>{fmtMoney(tpl.exp, 'PKR')}</div></div>
        <div className="kpi k-blue"><div className="tag-corner" /><div className="kl">Net recurring / mo</div><div className={`kv ${tpl.net >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 23 }}>{fmtMoney(tpl.net, 'PKR')}</div></div>
        <div className="kpi k-gold"><div className="tag-corner" /><div className="kl">Active items</div><div className="kv" style={{ fontSize: 23 }}>{list.length}</div></div>
      </div>
      <div className="money-grid">
        <div className="card">
          <div className="rec-head"><h3>Recurring income</h3><button className="btn small" onClick={() => onAdd('income')}>+ Add income</button></div>
          {income.length ? income.map(itemRow) : <p className="tiny" style={{ padding: '12px 4px' }}>No recurring income yet.</p>}
        </div>
        <div className="card">
          <div className="rec-head"><h3>Recurring expense</h3><button className="btn small" onClick={() => onAdd('expense')}>+ Add expense</button></div>
          {expense.length ? expense.map(itemRow) : <p className="tiny" style={{ padding: '12px 4px' }}>No recurring expenses yet.</p>}
        </div>
      </div>
    </div>
  );
}
