'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { Sparkline } from '@/components/Sparkline';
import { EmptyState } from '@/components/EmptyState';
import { todayKey, fmtShort, fromKey, dkey, monthKey, MO } from '@/lib/dates';
import { fmtMoney } from '@/lib/money';
import { habitDueOn } from '@/lib/habits';
import { isRecurring } from '@/lib/tasks';
import { Clapperboard } from 'lucide-react';

type ReviewMode = 'week' | 'month';

/* ── Helpers ── */
function toPKR(amt: number, cur: string, usdRate: number) {
  return cur === 'USD' ? amt * usdRate : amt;
}

function rangeFor(mode: ReviewMode) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  let start: Date;
  if (mode === 'week') {
    start = new Date();
    start.setDate(start.getDate() - 6);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function prevRangeFor(mode: ReviewMode) {
  const { start } = rangeFor(mode);
  if (mode === 'week') {
    const e = new Date(start);
    e.setDate(e.getDate() - 1);
    const s = new Date(e);
    s.setDate(s.getDate() - 6);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  const s = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const e = new Date(start.getFullYear(), start.getMonth(), 0);
  e.setHours(23, 59, 59, 999);
  return { start: s, end: e };
}

function inRange(k: string | null, r: { start: Date; end: Date }) {
  if (!k) return false;
  const d = fromKey(k);
  return d >= r.start && d <= r.end;
}

function tsInRange(ts: number | null, r: { start: Date; end: Date }) {
  if (!ts) return false;
  return ts >= r.start.getTime() && ts <= r.end.getTime();
}

function tasksCompletedIn(tasks: any[], r: { start: Date; end: Date }) {
  let n = 0;
  tasks.forEach((t) => {
    if (isRecurring(t)) {
      if (t.log) Object.keys(t.log).forEach((k) => { if (t.log[k] && inRange(k, r)) n++; });
    } else if (t.done && t.doneAt && tsInRange(t.doneAt, r)) n++;
  });
  return n;
}

function habitStampsIn(habits: any[], r: { start: Date; end: Date }) {
  let n = 0;
  habits.forEach((h) => {
    if (h.log) Object.keys(h.log).forEach((k) => { if (h.log[k] && inRange(k, r)) n++; });
  });
  return n;
}

function contentPublishedIn(content: any[], r: { start: Date; end: Date }) {
  return content.filter((c) => c.stage === 'Published' && (c.publishedAt ? tsInRange(c.publishedAt, r) : inRange(c.publishDate, r))).length;
}

function moneyIn(money: any[], r: { start: Date; end: Date }, usdRate: number) {
  let inc = 0, exp = 0;
  money.forEach((m) => {
    if (!inRange(m.date, r)) return;
    const p = toPKR(m.amount, m.currency, usdRate);
    if (m.type === 'income') inc += p; else exp += p;
  });
  return { inc, exp, net: inc - exp };
}

function projectsShippedIn(projects: any[], r: { start: Date; end: Date }) {
  return projects.filter((p) => p.status === 'Shipped' && p.shippedAt && tsInRange(p.shippedAt, r)).length;
}

function pctDelta(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round((cur - prev) / Math.abs(prev) * 100);
}

function trendChip(cur: number, prev: number, goodUp = true) {
  const d = pctDelta(cur, prev);
  if (d === 0) return { cls: 'trend-flat', text: '— flat' };
  const up = d > 0;
  const good = goodUp ? up : !up;
  return { cls: good ? 'trend-up' : 'trend-dn', text: `${up ? '▲' : '▼'} ${Math.abs(d)}% vs last` };
}

/* ── Heatmap component ── */
function ContentHeatmap({ content, settings }: { content: any[]; settings: any }) {
  const plats = (settings.platforms || []).slice(0, 7);
  const hasData = content.some((c) => c.publishDate || c.publishedAt);
  if (!hasData) return <EmptyState icon={Clapperboard} label="no history yet" message="Publish content with dates and this heatmap fills in over the weeks." />;

  const weeks = 12;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const weekStarts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const s = new Date(end);
    s.setDate(s.getDate() - 7 * i - 6);
    s.setHours(0, 0, 0, 0);
    weekStarts.push(s);
  }

  const counts: Record<string, number[]> = {};
  plats.forEach((p: string) => (counts[p] = Array(weeks).fill(0)));

  content.forEach((c) => {
    const k = c.publishedAt ? dkey(new Date(c.publishedAt)) : c.publishDate;
    if (!k) return;
    const d = fromKey(k);
    weekStarts.forEach((ws, wi) => {
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      if (d >= ws && d <= we) {
        (c.platforms || ['—']).forEach((p: string) => {
          if (counts[p]) counts[p][wi]++;
        });
      }
    });
  });

  const lvl = (n: number) => n === 0 ? '' : n === 1 ? 'l1' : n === 2 ? 'l2' : n <= 4 ? 'l3' : 'l4';

  return (
    <div>
      <div className="heatmap">
        <div className="hm-inner">
          <div className="hm-row">
            <span className="hm-rlabel"></span>
            {weekStarts.map((ws, i) => (
              <span key={i} className="hm-collabel">{i % 2 === 0 ? `${ws.getMonth() + 1}/${ws.getDate()}` : ''}</span>
            ))}
          </div>
          {plats.map((p: string) => (
            <div key={p} className="hm-row">
              <span className="hm-rlabel">{p}</span>
              {counts[p].map((n, i) => (
                <span key={i} className={`hm-cell ${lvl(n)}`} title={`${n} post${n !== 1 ? 's' : ''}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="hm-legend">
        Less{' '}
        <span className="hm-cell"></span>
        <span className="hm-cell l1"></span>
        <span className="hm-cell l2"></span>
        <span className="hm-cell l3"></span>
        <span className="hm-cell l4"></span>{' '}
        More
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ReviewPage() {
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const content = useStore((s) => s.content);
  const money = useStore((s) => s.money);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);

  const [mode, setMode] = useState<ReviewMode>('week');

  const data = useMemo(() => {
    const r = rangeFor(mode);
    const pr = prevRangeFor(mode);
    const usdRate = settings.usdRate || 278;
    const label = mode === 'week' ? 'Last 7 days' : `${MO[r.start.getMonth()]} ${r.start.getFullYear()}`;

    const tDone = tasksCompletedIn(tasks, r);
    const tPrev = tasksCompletedIn(tasks, pr);
    const hStamp = habitStampsIn(habits, r);
    const hPrev = habitStampsIn(habits, pr);
    const cPub = contentPublishedIn(content, r);
    const cPrev = contentPublishedIn(content, pr);
    const mn = moneyIn(money, r, usdRate);
    const mnPrev = moneyIn(money, pr, usdRate);
    const shipped = projectsShippedIn(projects, r);

    // Habit consistency %
    let due = 0, hit = 0;
    for (let d = new Date(r.start); d <= r.end && d <= new Date(); d.setDate(d.getDate() + 1)) {
      const k = dkey(d);
      habits.forEach((h) => {
        if (habitDueOn(h, k)) {
          due++;
          if (h.log && h.log[k]) hit++;
        }
      });
    }
    const consist = due ? Math.round(hit / due * 100) : 0;

    // Verdict
    let verdict: string;
    if (!tasks.length && !habits.length && !content.length && !money.length) {
      verdict = 'Once you start logging tasks, habits, content and money, this page becomes your weekly scoreboard.';
    } else if (mn.net >= 0 && consist >= 70 && cPub > 0) {
      verdict = `Strong stretch — <b>${cPub}</b> published, habits at <b>${consist}%</b>, and you finished <b>${fmtMoney(mn.net, 'PKR')}</b> in the green.`;
    } else if (mn.net < 0) {
      verdict = `Busy but the ledger dipped <b>${fmtMoney(mn.net, 'PKR')}</b>. You shipped ${cPub} and cleared ${tDone} tasks — watch the spend next ${mode === 'week' ? 'week' : 'month'}.`;
    } else {
      verdict = `You cleared <b>${tDone}</b> tasks and stamped <b>${hStamp}</b> habits${cPub ? `, publishing <b>${cPub}</b>` : ''}. Steady progress.`;
    }

    // Sparkline data (last 6 periods)
    const spInc: number[] = [];
    const spNet: number[] = [];
    const spPub: number[] = [];
    for (let i = 5; i >= 0; i--) {
      let s: Date, e: Date;
      if (mode === 'week') {
        e = new Date();
        e.setDate(e.getDate() - 7 * i);
        e.setHours(23, 59, 59, 999);
        s = new Date(e);
        s.setDate(s.getDate() - 6);
        s.setHours(0, 0, 0, 0);
      } else {
        const base = new Date();
        s = new Date(base.getFullYear(), base.getMonth() - i, 1);
        e = new Date(base.getFullYear(), base.getMonth() - i + 1, 0);
        e.setHours(23, 59, 59, 999);
      }
      const rr = { start: s, end: e };
      const mm = moneyIn(money, rr, usdRate);
      spInc.push(Math.round(mm.inc));
      spNet.push(Math.round(mm.net));
      spPub.push(contentPublishedIn(content, rr));
    }

    // Expense categories
    const catMap: Record<string, number> = {};
    money.forEach((m) => {
      if (m.type === 'expense' && inRange(m.date, r)) {
        catMap[m.category || 'Uncategorised'] = (catMap[m.category || 'Uncategorised'] || 0) + toPKR(m.amount, m.currency, usdRate);
      }
    });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = cats.length ? cats[0][1] : 1;

    // Habit leaderboard
    const hb = habits
      .map((h) => {
        let c = 0;
        if (h.log) Object.keys(h.log).forEach((k) => { if (h.log[k] && inRange(k, r)) c++; });
        return { h, c };
      })
      .filter((x) => x.c > 0)
      .sort((a, b) => b.c - a.c)
      .slice(0, 5);
    const maxHb = hb.length ? hb[0].c : 1;

    return { label, tDone, tPrev, hStamp, hPrev, cPub, cPrev, mn, mnPrev, shipped, consist, verdict, spInc, spNet, spPub, cats, maxCat, hb, maxHb };
  }, [mode, tasks, habits, content, money, projects, settings]);

  const scorecards = [
    { label: 'Income', value: fmtMoney(data.mn.inc, 'PKR'), trend: trendChip(data.mn.inc, data.mnPrev.inc), spark: data.spInc, sparkColor: 'var(--pine)' },
    { label: 'Net profit', value: fmtMoney(data.mn.net, 'PKR'), trend: trendChip(data.mn.net, data.mnPrev.net), spark: data.spNet, sparkColor: data.mn.net < 0 ? 'var(--neg)' : 'var(--pine)' },
    { label: 'Published', value: String(data.cPub), trend: trendChip(data.cPub, data.cPrev), spark: data.spPub, sparkColor: 'var(--blue)' },
    { label: 'Tasks done', value: String(data.tDone), trend: trendChip(data.tDone, data.tPrev), spark: null, sparkColor: '' },
    { label: 'Habit consistency', value: `${data.consist}%`, trend: trendChip(data.hStamp, data.hPrev), sub: `${data.hStamp} stamps`, spark: null, sparkColor: '' },
    { label: 'Projects shipped', value: String(data.shipped), trend: null, sub: data.shipped ? 'nice work' : `none this ${mode === 'week' ? 'week' : 'month'}`, spark: null, sparkColor: '' },
  ];

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Step back &amp; see the pattern</span>
            <h1 className="h-view">Review</h1>
            <p className="sub">How the week and month actually went — your own case study.</p>
          </div>
          <div className="vtoggle">
            <button className={mode === 'week' ? 'on' : ''} onClick={() => setMode('week')}>This week</button>
            <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>This month</button>
          </div>
        </div>

        {/* Headline */}
        <div className="rev-headline">
          <div className="rng">{data.label} · review</div>
          <div className="verdict" dangerouslySetInnerHTML={{ __html: data.verdict }} />
        </div>

        {/* Scorecards */}
        <div className="scorecards">
          {scorecards.map((s, i) => (
            <div key={i} className="scard">
              <div className="sl">{s.label}</div>
              <div className="sv">{s.value}</div>
              <div className="sd">
                {s.trend && <span className={s.trend.cls}>{s.trend.text}</span>}
                {!s.trend && s.sub && <span className="tiny" style={{ color: 'var(--muted)' }}>{s.sub}</span>}
              </div>
              {s.spark && (
                <div className="spark">
                  <Sparkline values={s.spark} color={s.sparkColor} width={80} height={28} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Expense categories + habit leaderboard */}
        <div className="rev-grid">
          <div className="card chartcard">
            <h3>Where money went</h3>
            <p className="sub">Top expense categories this {mode === 'week' ? 'week' : 'month'}.</p>
            <div className="rev-list">
              {data.cats.length ? data.cats.map(([cat, amt], i) => (
                <div key={i} className="rev-li">
                  <span className="rt">{cat}</span>
                  <span className="hbar"><i style={{ width: `${Math.round(amt / data.maxCat * 100)}%`, background: 'var(--neg)' }} /></span>
                  <span className="rn">{fmtMoney(amt, 'PKR')}</span>
                </div>
              )) : (
                <p className="tiny" style={{ padding: '8px 2px' }}>No expenses logged in this range.</p>
              )}
            </div>
          </div>
          <div className="card chartcard">
            <h3>Most-stamped habits</h3>
            <p className="sub">Your consistency leaders in this range.</p>
            <div className="rev-list">
              {data.hb.length ? data.hb.map((x, i) => (
                <div key={i} className="rev-li">
                  <span className="rt">{x.h.icon || '✦'} {x.h.name}</span>
                  <span className="hbar"><i style={{ width: `${Math.round(x.c / data.maxHb * 100)}%` }} /></span>
                  <span className="rn">{x.c}×</span>
                </div>
              )) : (
                <p className="tiny" style={{ padding: '8px 2px' }}>No habit stamps in this range.</p>
              )}
            </div>
          </div>
        </div>

        {/* Content heatmap */}
        <div className="card chartcard" style={{ marginTop: 18 }}>
          <h3>Content consistency</h3>
          <p className="sub">Publishing activity by platform over the last 12 weeks — darker means more.</p>
          <ContentHeatmap content={content} settings={settings} />
        </div>
      </section>
    </>
  );
}
