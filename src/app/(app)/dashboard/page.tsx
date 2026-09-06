'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Sparkline } from '@/components/Sparkline';
import { todaysTasks, taskDoneOn, isRecurring } from '@/lib/tasks';
import { habitDueOn, habitStreak } from '@/lib/habits';
import { todayKey, dkey, monthKey, DAY } from '@/lib/dates';
import { fmtMoney } from '@/lib/money';
import { portfolioTotals, loanTotals, monthNet } from '@/lib/money';
import {
  ClipboardCheck,
  Coins,
  TrendingUp,
  Wallet,
  Bell,
  Folder,
  MonitorPlay,
  Heart,
  type LucideIcon,
} from 'lucide-react';

export default function DashboardPage() {
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const content = useStore((s) => s.content);
  const projects = useStore((s) => s.projects);
  const money = useStore((s) => s.money);
  const holdings = useStore((s) => s.holdings);
  const loans = useStore((s) => s.loans);
  const reminders = useStore((s) => s.reminders);
  const settings = useStore((s) => s.settings);

  const key = todayKey();
  const nm = (settings.name || 'Ahsan').split(' ')[0];
  const cur = settings.baseCurrency || 'USD';

  const tl = todaysTasks(tasks);
  const openT = tl.filter((x) => !taskDoneOn(x.t, key)).length;
  const doneT = tl.length - openT;

  const hb = habits.filter((h) => habitDueOn(h, key));
  const doneH = hb.filter((h) => h.log && h.log[key]).length;

  const bestStreak = habits.length
    ? Math.max(0, ...habits.map((h) => habitStreak(h).cur))
    : 0;

  const mk = monthKey(key);
  const mn = monthNet(mk, money);
  const pf = portfolioTotals(holdings);
  const lt = loanTotals(loans);
  const netPos = pf.cur + lt.recv - lt.pay;

  const activeProj = projects.filter((p) => p.status !== 'Shipped' && !p.archived);
  const shippedProj = projects.filter((p) => p.status === 'Shipped');
  const pipeline = content.filter((c) => c.stage !== 'Published');
  const overdue = tasks.filter(
    (t) => !isRecurring(t) && t.due && t.due < key && !t.done,
  ).length;

  const stageCounts: Record<string, number> = {};
  (settings.stages || []).forEach((s) => {
    if (s !== 'Published') stageCounts[s] = 0;
  });
  pipeline.forEach((c) => {
    stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
  });

  const topHabits = habits
    .map((h) => ({ h, s: habitStreak(h).cur }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4);

  const netSeries: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    netSeries.push(Math.round(monthNet(monthKey(dkey(d)), money).net));
  }

  const remindersUrgent = reminders.filter((r) => !r.done && r.remindAt && r.remindAt < Date.now() + 7 * DAY);

  return (
    <>
      <Link href="/today" className="ab-add" style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="dash-head">
          <span className="eyebrow">The whole system at a glance</span>
          <h1 className="h-view">Dashboard</h1>
          <p className="sub">
            Hey {nm} — here&apos;s how your whole operation is doing right now.
          </p>
        </div>

        {/* Row 1: KPI cards */}
        <div className="dash-grid">
          <Link href="/today" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><ClipboardCheck size={16} strokeWidth={1.8} />Today&apos;s progress</h3>
              <span className="go">view →</span>
            </div>
            <div className="dstat">
              <div className="dv">{doneT}/{tl.length}</div>
              <div className="dl">tasks done today</div>
              <div className="dsub">{openT ? openT + ' still pending' : 'all clear ✓'} · {doneH}/{hb.length} habits</div>
            </div>
          </Link>

          <Link href="/money" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><Coins size={16} strokeWidth={1.8} />This month net</h3>
              <span className="go">view →</span>
            </div>
            <div className="dstat">
              <div className={`dv ${mn.net >= 0 ? 'pos' : 'neg'}`}>{fmtMoney(mn.net, cur)}</div>
              <div className="dl">income − expense</div>
              <div className="dsub">in {fmtMoney(mn.inc, cur)} · out {fmtMoney(mn.exp, cur)}</div>
            </div>
          </Link>

          <Link href="/money" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><TrendingUp size={16} strokeWidth={1.8} />Portfolio value</h3>
              <span className="go">view →</span>
            </div>
            <div className="dstat">
              <div className="dv">{fmtMoney(pf.cur, cur)}</div>
              <div className="dl">current holdings</div>
              <div className={`dsub ${pf.pl >= 0 ? 'pos' : 'neg'}`}>
                {pf.pl >= 0 ? '▲ ' : '▼ '}{fmtMoney(pf.pl, cur)} unrealized
              </div>
            </div>
          </Link>

          <Link href="/money" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><Wallet size={16} strokeWidth={1.8} />Net position</h3>
              <span className="go">view →</span>
            </div>
            <div className="dstat">
              <div className="dv">{fmtMoney(netPos, cur)}</div>
              <div className="dl">portfolio + owed − debts</div>
              <div className="dsub">{lt.recv ? fmtMoney(lt.recv, cur) + ' to collect' : 'no receivables'}</div>
            </div>
          </Link>
        </div>

        {/* Row 2: Money trend + Needs attention */}
        <div className="dash-wide">
          <div className="dcard">
            <div className="dc-h">
              <h3><TrendingUp size={16} strokeWidth={1.8} />Money trend</h3>
              <span className="go">last 6 months</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <Sparkline
                  values={netSeries}
                  color={netSeries[netSeries.length - 1] < 0 ? 'var(--red)' : 'var(--pine)'}
                  width={420}
                  height={70}
                />
              </div>
            </div>
            <div className="dmini" style={{ marginTop: 10 }}>
              <span className="k">Published this week</span>
              <span className="v">{content.filter((c) => c.stage === 'Published').length}</span>
            </div>
            <div className="dmini">
              <span className="k">Best habit streak</span>
              <span className="v">{bestStreak} days</span>
            </div>
          </div>

          <Link href="/today" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><Bell size={16} strokeWidth={1.8} />Needs attention</h3>
              <span className="go">{remindersUrgent.length} items</span>
            </div>
            {remindersUrgent.length > 0 ? (
              remindersUrgent.slice(0, 4).map((r) => (
                <div key={r.id} className="dmini">
                  <span className="k">{r.title}</span>
                  <span className="v" style={{ color: 'var(--red)' }}>
                    {r.remindAt && r.remindAt < Date.now() ? 'overdue' : 'upcoming'}
                  </span>
                </div>
              ))
            ) : (
              <p className="tiny" style={{ padding: '10px 0', color: 'var(--muted)' }}>
                Nothing urgent. You&apos;re on top of it.
              </p>
            )}
            {overdue > 0 && (
              <div className="dmini">
                <span className="k">Overdue tasks</span>
                <span className="v neg">{overdue}</span>
              </div>
            )}
          </Link>
        </div>

        {/* Row 3: Projects + Content pipeline + Habits */}
        <div className="dash-grid">
          <Link href="/projects" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><Folder size={16} strokeWidth={1.8} />Projects</h3>
              <span className="go">manage →</span>
            </div>
            <div className="dquad">
              <div className="qd">
                <div className="qv">{activeProj.length}</div>
                <div className="ql">active</div>
              </div>
              <div className="qd">
                <div className="qv">{shippedProj.length}</div>
                <div className="ql">shipped</div>
              </div>
            </div>
            {activeProj.length > 0 && (
              <div className="dchips" style={{ marginTop: 10 }}>
                {activeProj.slice(0, 3).map((p) => (
                  <span key={p.id} className="chip">{p.name}</span>
                ))}
                {activeProj.length > 3 && (
                  <span className="chip">+{activeProj.length - 3}</span>
                )}
              </div>
            )}
          </Link>

          <Link href="/content" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><MonitorPlay size={16} strokeWidth={1.8} />Content pipeline</h3>
              <span className="go">board →</span>
            </div>
            <div className="dstat" style={{ marginBottom: 8 }}>
              <div className="dv">{pipeline.length}</div>
              <div className="dl">in progress</div>
            </div>
            {Object.entries(stageCounts)
              .filter(([, v]) => v > 0)
              .slice(0, 4)
              .map(([k, v]) => (
                <div key={k} className="dmini">
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
          </Link>

          <Link href="/habits" className="dcard click" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dc-h">
              <h3><Heart size={16} strokeWidth={1.8} />Habit streaks</h3>
              <span className="go">habits →</span>
            </div>
            {topHabits.length > 0 ? (
              topHabits.map((x) => (
                <div key={x.h.id} className="dmini">
                  <span className="k">{x.h.icon || '✦'} {x.h.name}</span>
                  <span className="v">{x.s}d</span>
                </div>
              ))
            ) : (
              <p className="tiny" style={{ padding: '10px 0', color: 'var(--muted)' }}>
                No habits yet.
              </p>
            )}
          </Link>
        </div>
      </section>
    </>
  );
}
