'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { habitDueOn, habitStreak } from '@/lib/habits';
import { todayKey, dkey, WD, fromKey } from '@/lib/dates';
import { uid } from '@/lib/id';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import type { Habit } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  Coffee,
  Play,
  Pencil,
  Phone,
  Flag,
  Heart,
  Target,
  Zap,
  Diamond,
  type LucideIcon,
} from 'lucide-react';

const HABIT_ICONS = ['sparkles', 'coffee', 'play', 'pencil', 'phone', 'flag', 'heart', 'target', 'zap', 'diamond'];

const HABIT_ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  coffee: Coffee,
  play: Play,
  pencil: Pencil,
  phone: Phone,
  flag: Flag,
  heart: Heart,
  target: Target,
  zap: Zap,
  diamond: Diamond,
};

function HabitIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = HABIT_ICON_MAP[name];
  if (Icon) return <Icon size={size} strokeWidth={2} />;
  return <span>{name}</span>;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(h: Habit) {
  const today = todayKey();
  const endD = fromKey(today);
  const dayOfWeek = endD.getDay();
  endD.setDate(endD.getDate() + (6 - dayOfWeek));

  const startD = new Date(endD);
  startD.setDate(startD.getDate() - 11 * 7);

  const cells: { key: string; cls: string }[] = [];
  const cursor = new Date(startD);
  while (cursor <= endD) {
    const k = dkey(cursor);
    const isFuture = k > today;
    const due = habitDueOn(h, k);
    const logged = !!(h.log && h.log[k]);
    const isToday = k === today;
    let cls = 'hcell';
    if (isFuture || !due) cls += ' off';
    else if (logged) cls += ' hit';
    if (isToday) cls += ' today-cell';
    cells.push({ key: k, cls });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function buildChartData(habits: Habit[]) {
  const today = todayKey();
  const endD = fromKey(today);
  const dayOfWeek = endD.getDay();
  endD.setDate(endD.getDate() + (6 - dayOfWeek));
  const startD = new Date(endD);
  startD.setDate(startD.getDate() - 13);

  const data: { day: string; count: number }[] = [];
  const cursor = new Date(startD);
  while (cursor <= endD) {
    const k = dkey(cursor);
    let count = 0;
    for (const h of habits) {
      if (habitDueOn(h, k) && h.log && h.log[k]) count++;
    }
    const label = WD[cursor.getDay()];
    data.push({ day: label, count });
    cursor.setDate(cursor.getDate() + 1);
  }
  return data;
}

function scheduleLabel(h: Habit): string {
  if (!h.days || h.days.length === 7) return 'Every day';
  if (h.days.length === 5 && [1, 2, 3, 4, 5].every((d) => h.days!.includes(d)))
    return 'Weekdays';
  return h.days.map((d) => DAY_LABELS[d]).join(', ');
}

export default function HabitsPage() {
  const habits = useStore((s) => s.habits);
  const putHabit = useStore((s) => s.putHabit);
  const delHabit = useStore((s) => s.delHabit);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [days, setDays] = useState<number[]>(DAYS);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') openAdd();
  }, []);

  const chartData = useMemo(() => buildChartData(habits), [habits]);
  const today = todayKey();

  function openAdd() {
    setEditId(null);
    setName('');
    setIcon('sparkles');
    setDays(DAYS);
    setModal(true);
  }

  function openEdit(h: Habit) {
    setEditId(h.id);
    setName(h.name);
    setIcon(h.icon || 'sparkles');
    setDays(h.days || DAYS);
    setModal(true);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Name required');
      return;
    }
    if (editId) {
      const existing = habits.find((h) => h.id === editId);
      if (existing) {
        putHabit({ ...existing, name: trimmed, icon, days });
      }
      toast('Habit updated');
    } else {
      const h: Habit = {
        id: uid(),
        created: Date.now(),
        name: trimmed,
        icon,
        days,
        log: {},
      };
      putHabit(h);
      toast('Habit created');
    }
    setModal(false);
  }

  function toggleDone(h: Habit) {
    const logged = !!(h.log && h.log[today]);
    putHabit({ ...h, log: { ...(h.log || {}), [today]: !logged } });
    toast(logged ? 'Unstamped' : 'Stamped');
  }

  function remove(id: string) {
    if (!confirm('Delete this habit?')) return;
    delHabit(id);
    toast('Habit deleted');
  }

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? (prev.length === 1 ? prev : prev.filter((x) => x !== d)) : [...prev, d].sort()
    );
  }

  return (
    <>
      <Appbar onAdd={openAdd} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <div className="eyebrow">Consistency</div>
            <h1 className="h-view">Habits</h1>
            <p className="sub">Track streaks and build momentum.</p>
          </div>
          <button className="btn primary" onClick={openAdd}>
            + New habit
          </button>
        </div>

        {habits.length > 0 && (
          <div className="chartcard">
            <h3>Habits stamped per day</h3>
            <p className="sub">Last 14 days</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} width={30} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--pine)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="hgrid">
          {habits.map((h) => {
            const s = habitStreak(h);
            const grid = buildGrid(h);
            const stamped = !!(h.log && h.log[today]);
            return (
              <div className="hcard" key={h.id}>
                <div className="hcard-top">
                  <div className={`ring${stamped ? ' on' : ''}`}><HabitIcon name={h.icon || 'sparkles'} /></div>
                  <div className="hn">
                    <b>{h.name}</b>
                    <span>{scheduleLabel(h)}</span>
                  </div>
                  <button className="btn small ghost" onClick={() => openEdit(h)}>
                    edit
                  </button>
                </div>
                <div className="hstats">
                  <div className="hstat">
                    <div className="n">
                      <em>{s.cur}</em>d
                    </div>
                    <div className="l">streak</div>
                  </div>
                  <div className="hstat">
                    <div className="n">{s.best}</div>
                    <div className="l">best</div>
                  </div>
                  <div className="hstat">
                    <div className="n">{s.total}</div>
                    <div className="l">all-time</div>
                  </div>
                </div>
                <div className="hweeks">
                  {grid.map((c) => (
                    <div key={c.key} className={c.cls} title={c.key} />
                  ))}
                </div>
                <div className="hcard-foot">
                  <button
                    className={`btn small${stamped ? ' danger' : ' primary'}`}
                    onClick={() => toggleDone(h)}
                  >
                    {stamped ? 'Unstamp today' : 'Stamp today'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit habit' : 'New habit'}
        footer={
          <>
            <button className="btn primary" onClick={save}>
              {editId ? 'Save' : 'Add'}
            </button>
            {editId && (
              <button
                className="btn danger"
                onClick={() => {
                  remove(editId);
                  setModal(false);
                }}
              >
                Delete
              </button>
            )}
          </>
        }
      >
        <div className="fld">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Read 30 min"
            autoFocus
          />
        </div>
        <div className="fld">
          <label>Icon</label>
          <div className="seg">
            {HABIT_ICONS.map((ic) => (
              <button key={ic} className={icon === ic ? 'on' : ''} onClick={() => setIcon(ic)}>
                <HabitIcon name={ic} size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="fld">
          <label>Days</label>
          <div className="seg">
            {DAYS.map((d) => (
              <button key={d} className={days.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
