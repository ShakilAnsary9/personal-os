'use client';

import { useStore } from '@/lib/store';
import { todaysTasks, taskDoneOn, repeatLabel } from '@/lib/tasks';
import { habitDueOn, habitStreak } from '@/lib/habits';
import { todayKey, fromKey, daysBetween, fmtShort, WD } from '@/lib/dates';
import { Appbar } from '@/components/Appbar';
import { EmptyState } from '@/components/EmptyState';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadSampleData } from '@/lib/sample-data';
import { ClipboardCheck, Heart, Coffee, RotateCw, Flag, Sparkles } from 'lucide-react';

function dayPart(): string {
  const h = new Date().getHours();
  if (h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 12) return 'morning';
  if (h < 16) return 'noon';
  if (h < 19) return 'evening';
  if (h < 22) return 'dusk';
  return 'night';
}

const PART_META: Record<string, { cap: string; greet: string; color: string }> = {
  dawn: { cap: 'Dawn', greet: 'Fajr time', color: 'var(--plum)' },
  morning: { cap: 'Morning', greet: 'Subah bakhair', color: 'var(--gold)' },
  noon: { cap: 'Midday', greet: 'Good afternoon', color: 'var(--red)' },
  evening: { cap: 'Evening', greet: 'Good evening', color: 'var(--gold)' },
  dusk: { cap: 'Dusk', greet: 'Shaam bakhair', color: 'var(--red)' },
  night: { cap: 'Night', greet: 'Late shift', color: 'var(--blue)' },
};

const GREET: Record<string, string> = Object.fromEntries(
  Object.entries(PART_META).map(([k, v]) => [k, v.greet])
);

function countdownHTML(due: string): { text: string; icon?: React.ReactNode } {
  const key = todayKey();
  const dd = daysBetween(key, due);
  if (dd < 0) return { text: `${-dd}d overdue`, icon: <Flag size={11} /> };
  if (dd === 0) return { text: 'due today' };
  if (dd === 1) return { text: 'tomorrow' };
  return { text: `${dd}d left` };
}

function countdownClass(due: string): string {
  const key = todayKey();
  const dd = daysBetween(key, due);
  if (dd <= 0) return 'cd-red';
  if (dd <= 2) return 'cd-gold';
  return 'cd-pine';
}

export default function TodayPage() {
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const projects = useStore((s) => s.projects);
  const content = useStore((s) => s.content);
  const settings = useStore((s) => s.settings);
  const putTask = useStore((s) => s.putTask);
  const putHabit = useStore((s) => s.putHabit);
  const loadAll = useStore((s) => s.loadAll);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const key = todayKey();
  const part = dayPart();
  const meta = PART_META[part];
  const name = (settings.name || 'Ahsan').split(' ')[0];

  const tl = todaysTasks(tasks);
  const openTasks = tl.filter((x) => !taskDoneOn(x.t, key)).length;

  const hb = habits.filter((h) => habitDueOn(h, key));
  const doneH = hb.filter((h) => h.log && h.log[key]).length;

  const allToday = tl.length + hb.length;
  const doneToday = (tl.length - openTasks) + doneH;
  const totalLeft = openTasks + hb.filter((h) => !(h.log && h.log[key])).length;
  const pct = allToday ? Math.round(doneToday / allToday * 100) : 0;

  const nowDate = now || new Date();
  const wd = nowDate.toLocaleDateString('en-GB', { weekday: 'long' });
  const md = nowDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const start = new Date(nowDate.getFullYear(), 0, 0);
  const doy = Math.floor((nowDate.getTime() - start.getTime()) / 86400000);

  const hh = nowDate.getHours() % 12 || 12;
  const mm = String(nowDate.getMinutes()).padStart(2, '0');
  const ss = String(nowDate.getSeconds()).padStart(2, '0');
  const amp = nowDate.getHours() < 12 ? 'AM' : 'PM';

  function toggleTaskDone(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const updated = { ...t };
    if (t.repeat !== 'once') {
      updated.log = { ...(t.log || {}), [key]: !(t.log && t.log[key]) };
    } else {
      updated.done = !t.done;
      updated.doneAt = !t.done ? Date.now() : null;
    }
    putTask(updated);
  }

  function toggleHabitDone(habitId: string) {
    const h = habits.find((x) => x.id === habitId);
    if (!h) return;
    const updated = { ...h, log: { ...(h.log || {}), [key]: !(h.log && h.log[key]) } };
    putHabit(updated);
  }

  let greetLine: string;
  if (totalLeft === 0 && allToday > 0) {
    greetLine = 'Everything is stamped and shipped. Rare day — enjoy it.';
  } else if (allToday === 0) {
    greetLine = 'Nothing scheduled yet. Use + Add to create a task.';
  } else {
    greetLine = `Here is the desk: ${openTasks} task${openTasks !== 1 ? 's' : ''} and ${hb.length - doneH} habit${hb.length - doneH !== 1 ? 's' : ''} waiting for your stamp.`;
  }

  const projName = (id: string) => projects.find((p) => p.id === id)?.name || null;

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="today-head">
          <div className="mh-kicker">
            <span className="dotline" />
            <span>Daily issue Nº {doy} / {nowDate.getFullYear()}</span>
          </div>
          <h1 className="mh-date">
            {wd} <em>·</em> {md}
          </h1>
          <p className="mh-greet">
            {GREET[part]}, <b>{name}</b>. {greetLine}
          </p>
          <div className="mh-progress">
            {allToday > 0 && (
              <div className="prog-track">
                <i style={{ width: `${pct}%` }} />
              </div>
            )}
            {allToday === 0 ? (
              <span className="prog-label">Nothing scheduled yet today.</span>
            ) : totalLeft === 0 ? (
              <span className="prog-label prog-done">✓ All {allToday} done — clear desk.</span>
            ) : (
              <span className="prog-label">
                <b>{totalLeft}</b> left
                {doneToday > 0 && <> · <span className="prog-done">{doneToday} done</span></>}
              </span>
            )}
          </div>
        </div>

        {!tasks.length && !habits.length && !projects.length && !content?.length && (
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="panel-h">
              <h3>
                <Sparkles size={16} strokeWidth={1.8} />
                Welcome to your daily cockpit, {name}
              </h3>
              <span className="mono">first run</span>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: 14 }}>
              Set your display name and base currency, then add a couple of
              tasks and habits — or load sample data to see how the system
              feels with real entries.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn small" href="/settings">
                Name &amp; currency
              </Link>
              <button className="btn small ghost" onClick={async () => { await loadSampleData(); await loadAll(); }}>
                Load sample data
              </button>
            </div>
          </div>
        )}

        <div className="today-cols">
          {/* Tasks Panel */}
          <div className="panel panel-flat">
            <div className="panel-h">
              <h3>
                <ClipboardCheck size={16} strokeWidth={1.8} />
                {name}, your pending tasks
              </h3>
              <span className="mono">{tl.length ? `${openTasks} left` : ''}</span>
            </div>
            <div className="panel-b">
              {tl.length ? (
                tl.map(({ t, overdue }) => {
                  const done = taskDoneOn(t, key);
                  const rep = repeatLabel(t);
                  const pn = t.projectId ? projName(t.projectId) : null;
                  const cd = !done && t.due ? countdownHTML(t.due) : null;
                  return (
                    <div key={t.id} className={`trow${done ? ' done' : ''}`}>
                      <button
                        className="tcheck"
                        aria-label="Toggle done"
                        onClick={() => toggleTaskDone(t.id)}
                      />
                      <div className="t-main">
                        <div className="t-title">{t.title}</div>
                        {(rep || pn || cd) && (
                          <div className="t-meta">
                            {rep && <span className="chip pine"><RotateCw size={10} /> {rep}</span>}
                            {pn && <span className="chip gold">{pn}</span>}
                            {cd && (
                              <span className={`countdown ${countdownClass(t.due!)}`}>
                                {cd.icon} {cd.text}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState icon={Coffee} label="clear desk" message="Nothing scheduled today. Use + Add above to create a task." />
              )}
            </div>
          </div>

          {/* Habits Panel */}
          <div className="panel panel-flat">
            <div className="panel-h">
              <h3>
                <Heart size={16} strokeWidth={1.8} />
                Your habits today
              </h3>
              <span className="mono">{hb.length ? `${doneH}/${hb.length}` : ''}</span>
            </div>
            <div className="stamps">
              {hb.length ? (
                hb.map((h) => {
                  const d = !!(h.log && h.log[key]);
                  const streak = habitStreak(h);
                  return (
                    <button
                      key={h.id}
                      className={`stamp${d ? ' done' : ''}`}
                      onClick={() => toggleHabitDone(h.id)}
                    >
                      <span className="ring">{h.icon || '✦'}</span>
                      <span className="nm">{h.name}</span>
                      <span className="st">{streak.cur}d streak</span>
                    </button>
                  );
                })
              ) : (
                <EmptyState icon={Coffee} label="no habits" message="Add habits and stamp them daily." />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
