'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Task } from '@/types';
import {
  todaysTasks,
  taskDoneOn,
  isRecurring,
  repeatLabel,
  taskDueOn,
} from '@/lib/tasks';
import {
  todayKey,
  fromKey,
  daysBetween,
  fmtShort,
  dkey,
  WD,
  MO,
  DAY,
} from '@/lib/dates';
import { uid } from '@/lib/id';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import { Pencil, X, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

type Mode = 'list' | 'calendar';
type Repeat = Task['repeat'];

function countdownHTML(due: string): string {
  const key = todayKey();
  const dd = daysBetween(key, due);
  if (dd < 0) return `${-dd}d overdue`;
  if (dd === 0) return 'due today';
  if (dd === 1) return 'tomorrow';
  return `${dd}d left`;
}

function countdownClass(due: string): string {
  const key = todayKey();
  const dd = daysBetween(key, due);
  if (dd <= 0) return 'cd-red';
  if (dd <= 2) return 'cd-gold';
  return 'cd-pine';
}

interface FormState {
  title: string;
  repeat: Repeat;
  days: number[];
  due: string;
  projectId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  repeat: 'once',
  days: [],
  due: '',
  projectId: '',
  notes: '',
};

export default function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const putTask = useStore((s) => s.putTask);
  const delTask = useStore((s) => s.delTask);

  const [mode, setMode] = useState<Mode>('list');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') openAdd();
  }, []);

  const key = todayKey();

  const projName = (id: string) =>
    projects.find((p) => p.id === id)?.name || null;

  /* ── task helpers ── */
  function toggleDone(t: Task) {
    const u = { ...t };
    if (isRecurring(t)) {
      u.log = { ...(t.log || {}), [key]: !(t.log && t.log[key]) };
    } else {
      u.done = !t.done;
      u.doneAt = !t.done ? Date.now() : null;
    }
    putTask(u);
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(t: Task) {
    setEditId(t.id);
    setForm({
      title: t.title,
      repeat: t.repeat,
      days: t.days || [],
      due: t.due || '',
      projectId: t.projectId || '',
      notes: t.notes || '',
    });
    setModal(true);
  }

  function saveTask() {
    if (!form.title.trim()) return;
    const now = Date.now();
    const t: Task = editId
      ? { ...(tasks.find((x) => x.id === editId) as Task) }
      : { id: uid(), created: now, title: '', repeat: 'once' as const, days: null, due: null, done: false, doneAt: null, projectId: null, notes: null, needsDetail: false, log: {} };
    t.title = form.title.trim();
    t.repeat = form.repeat;
    t.days = form.repeat === 'weekly' ? form.days : null;
    t.due = form.repeat === 'once' ? (form.due || null) : null;
    t.projectId = form.projectId || null;
    t.notes = form.notes || null;
    putTask(t);
    toast(editId ? 'Task updated' : 'Task added');
    setModal(false);
  }

  function deleteTask(id: string) {
    delTask(id);
    toast('Task deleted');
    setConfirmDelete(null);
  }

  /* ── list sections ── */
  const todayList = todaysTasks(tasks);

  const upcoming = useMemo(() => {
    const dk = todayKey();
    return tasks
      .filter(
        (t) =>
          !isRecurring(t) &&
          !t.done &&
          t.due &&
          t.due > dk &&
          daysBetween(dk, t.due) <= 7,
      )
      .sort((a, b) => (a.due! < b.due! ? -1 : 1));
  }, [tasks]);

  const recurring = useMemo(
    () => tasks.filter((t) => isRecurring(t)),
    [tasks],
  );

  const undated = useMemo(
    () => tasks.filter((t) => !isRecurring(t) && !t.due),
    [tasks],
  );

  /* ── calendar ── */
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date; key: string; day: number; off: boolean; today: boolean; events: Task[] }> = [];

    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, -startDow + i + 1);
      cells.push({ date: d, key: dkey(d), day: d.getDate(), off: true, today: false, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dk = dkey(date);
      const today = dk === key;
      const events = tasks.filter((t) => {
        if (isRecurring(t)) return taskDueOn(t, dk);
        return t.due === dk;
      });
      cells.push({ date, key: dk, day: d, off: false, today, events });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: d, key: dkey(d), day: d.getDate(), off: true, today: false, events: [] });
    }

    return cells;
  }, [calMonth, tasks, key]);

  const calTitle = `${MO[calMonth.getMonth()]} ${calMonth.getFullYear()}`;

  function calPrev() {
    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1));
  }
  function calNext() {
    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1));
  }
  function calToday() {
    setCalMonth(new Date());
  }

  /* ── render task row ── */
  function renderRow(t: Task, dk?: string) {
    const done = dk ? taskDoneOn(t, dk) : !!t.done;
    const rep = repeatLabel(t);
    const pn = t.projectId ? projName(t.projectId) : null;
    return (
      <div key={t.id + (dk || '')} className={`trow${done ? ' done' : ''}`}>
        <button className="tcheck" aria-label="Toggle done" onClick={() => toggleDone(t)} />
        <div className="t-main">
          <div className="t-title">{t.title}</div>
          <div className="t-meta">
            {rep && <span className="chip pine"><RotateCw size={10} /> {rep}</span>}
            {pn && <span className="chip gold">{pn}</span>}
            {!done && t.due && (
              <span className={`countdown ${countdownClass(t.due)}`}>
                {countdownHTML(t.due)}
              </span>
            )}
            {t.needsDetail && <span className="chip needdetail">needs detail</span>}
          </div>
        </div>
        <button className="t-x" onClick={() => openEdit(t)} aria-label="Edit">
          <Pencil size={14} />
        </button>
        <button
          className="t-x"
          onClick={() => setConfirmDelete(t.id)}
          aria-label="Delete"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  /* ── week day picker for weekly ── */
  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));
  }

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Management</span>
            <h2 className="h-view">Tasks</h2>
            <p className="sub">All your tasks in one place</p>
          </div>
          <div className="vtoggle">
            <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}>
              List
            </button>
            <button className={mode === 'calendar' ? 'on' : ''} onClick={() => setMode('calendar')}>
              Calendar
            </button>
          </div>
          <button className="btn primary" onClick={openAdd}>
            + Add
          </button>
        </div>

        {mode === 'list' && (
          <div>
            <div className="tsec">
              <h4 className="tsec-h">Today</h4>
              {todayList.length ? (
                todayList.map(({ t }) => renderRow(t, key))
              ) : (
                <p className="sub">Nothing for today.</p>
              )}
            </div>

            {upcoming.length > 0 && (
              <div className="tsec">
                <h4 className="tsec-h">Upcoming</h4>
                {upcoming.map((t) => renderRow(t))}
              </div>
            )}

            <div className="tsec">
              <h4 className="tsec-h">Recurring</h4>
              {recurring.length ? (
                recurring.map((t) => renderRow(t))
              ) : (
                <p className="sub">No recurring tasks.</p>
              )}
            </div>

            {undated.length > 0 && (
              <div className="tsec">
                <h4 className="tsec-h">Undated</h4>
                {undated.map((t) => renderRow(t))}
              </div>
            )}
          </div>
        )}

        {mode === 'calendar' && (
          <div className="cal">
            <div className="cal-nav">
              <button className="btn ghost" onClick={calPrev}><ChevronLeft size={16} /></button>
              <span className="cal-h">{calTitle}</span>
              <button className="btn ghost" onClick={calNext}><ChevronRight size={16} /></button>
              <button className="btn ghost" onClick={calToday}>
                Today
              </button>
            </div>
            <div className="cal-grid">
              {WD.map((w) => (
                <div key={w} className="cal-dow">
                  {w}
                </div>
              ))}
              {calDays.map((c) => (
                <div
                  key={c.key}
                  className={`cal-cell${c.off ? ' off' : ''}${c.today ? ' today' : ''}`}
                >
                  <span>{c.day}</span>
                  {c.events.slice(0, 3).map((t) => (
                    <div key={t.id} className="cal-ev" onClick={() => openEdit(t)}>
                      {t.title}
                    </div>
                  ))}
                  {c.events.length > 3 && (
                    <div className="cal-more">+{c.events.length - 3} more</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title={editId ? 'Edit Task' : 'New Task'}
          footer={
            <button className="btn primary" onClick={saveTask}>
              {editId ? 'Save' : 'Add Task'}
            </button>
          }
        >
          <div className="fld">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="What needs doing?"
              autoFocus
            />
          </div>

          <div className="fld">
            <label>Repeat</label>
            <div className="seg">
              {(['once', 'daily', 'weekdays', 'weekly'] as Repeat[]).map((r) => (
                <button
                  key={r}
                  className={form.repeat === r ? 'on' : ''}
                  onClick={() => setForm((f) => ({ ...f, repeat: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {form.repeat === 'weekly' && (
            <div className="fld">
              <label>Days</label>
              <div className="dayseg">
                {WD.map((w, i) => (
                  <button
                    key={i}
                    className={form.days.includes(i) ? 'on' : ''}
                    onClick={() => toggleDay(i)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.repeat === 'once' && (
            <div className="fld">
              <label>Deadline</label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
              />
            </div>
          )}

          <div className="fld">
            <label>Project</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fld">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
        </Modal>

        {/* Delete confirm */}
        <Modal
          open={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          title="Delete task?"
          footer={
            <button
              className="btn danger"
              onClick={() => confirmDelete && deleteTask(confirmDelete)}
            >
              Delete
            </button>
          }
        >
          <p className="sub">This cannot be undone.</p>
        </Modal>
      </section>
    </>
  );
}
