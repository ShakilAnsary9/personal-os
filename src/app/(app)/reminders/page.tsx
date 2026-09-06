'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { uid } from '@/lib/id';
import { Bell, Check, AlarmClock, X } from 'lucide-react';
import type { Reminder } from '@/types';

function fmtReminderTime(d: Date): string {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return 'Today ' + tm;
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  if (d.toDateString() === tmr.toDateString()) return 'Tomorrow ' + tm;
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + tm
  );
}

function nextRepeatTime(ts: number, repeat: string): number {
  const d = new Date(ts);
  switch (repeat) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.getTime();
}

interface FormState {
  title: string;
  date: string;
  time: string;
  repeat: string;
  note: string;
}

export default function RemindersPage() {
  const reminders = useStore((s) => s.reminders);
  const putReminder = useStore((s) => s.putReminder);
  const delReminder = useStore((s) => s.delReminder);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: '',
    date: '',
    time: '',
    repeat: 'none',
    note: '',
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const now = Date.now();

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.remindAt || 0) - (b.remindAt || 0);
    });
  }, [reminders]);

  function openAdd() {
    const now = new Date();
    setEditId(null);
    setForm({
      title: '',
      date: now.toISOString().slice(0, 10),
      time: String(now.getHours() + 1).padStart(2, '0') + ':00',
      repeat: 'none',
      note: '',
    });
    setModal(true);
  }

  function openEdit(r: Reminder) {
    const d = r.remindAt ? new Date(r.remindAt) : new Date();
    setEditId(r.id);
    setForm({
      title: r.title,
      date: r.remindAt ? new Date(r.remindAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      time: r.remindAt
        ? new Date(r.remindAt).toISOString().slice(11, 16)
        : String(new Date().getHours() + 1).padStart(2, '0') + ':00',
      repeat: r.repeat || 'none',
      note: r.note || '',
    });
    setModal(true);
  }

  function save() {
    if (!form.title.trim()) {
      toast('Enter a title');
      return;
    }
    let remindAt: number | null = null;
    if (form.date && form.time) {
      remindAt = new Date(form.date + 'T' + form.time + ':00').getTime();
    } else if (form.date) {
      remindAt = new Date(form.date + 'T09:00:00').getTime();
    }
    const r: Reminder = editId
      ? { ...(reminders.find((x) => x.id === editId) as Reminder) }
      : { id: uid(), created: Date.now(), title: '', remindAt: null, repeat: 'none', note: null, done: false, updated: null };
    r.title = form.title.trim();
    r.remindAt = remindAt;
    r.repeat = form.repeat as Reminder['repeat'];
    r.note = form.note.trim() || null;
    r.done = false;
    r.updated = Date.now();
    putReminder(r);
    toast(editId ? 'Reminder saved' : 'Reminder added');
    setModal(false);
  }

  function toggleDone(id: string) {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    if (!r.done && r.repeat && r.repeat !== 'none') {
      const updated: Reminder = {
        ...r,
        done: false,
        remindAt: nextRepeatTime(r.remindAt || Date.now(), r.repeat),
      };
      putReminder(updated);
      toast('Repeated to ' + fmtReminderTime(new Date(updated.remindAt!)));
    } else {
      putReminder({ ...r, done: !r.done });
      toast(r.done ? 'Undone' : 'Done');
    }
  }

  function remove(id: string) {
    delReminder(id);
    toast('Reminder deleted');
    setConfirmDelete(null);
  }

  return (
    <>
      <Appbar onAdd={openAdd} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Don&apos;t miss</span>
            <h1 className="h-view">Reminders</h1>
            <p className="sub">Timed alerts and repeating nudges</p>
          </div>
          <button className="btn primary" onClick={openAdd}>
            + New reminder
          </button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={Bell}
            label="no reminders"
            message="Set a reminder and you will get a browser notification when it is time."
          />
        ) : (
          <div>
            {sorted.map((r) => {
              const isPast = r.remindAt && r.remindAt < now;
              const isOverdue = isPast && !r.done;
              const cls =
                'reminder-item' +
                (r.done ? ' done' : '') +
                (isOverdue ? ' overdue' : '');
              const timeStr = r.remindAt
                ? fmtReminderTime(new Date(r.remindAt))
                : 'No time set';
              const repeatStr =
                r.repeat && r.repeat !== 'none' ? ' ' + r.repeat : '';

              return (
                <div key={r.id} className={cls}>
                  <div className="reminder-ic">
                    {r.done ? <Check size={18} /> : isOverdue ? <AlarmClock size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="reminder-main">
                    <div className="reminder-title">{r.title || 'Reminder'}</div>
                    <div className="reminder-meta">
                      <span
                        className={`chip${isOverdue && !r.done ? ' red' : ''}`}
                      >
                        {timeStr}
                        {repeatStr}
                      </span>
                      {r.note && (
                        <span className="chip">
                          {r.note.substring(0, 30)}
                          {r.note.length > 30 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="reminder-actions">
                    <button
                      className={`btn small${r.done ? ' ghost' : ''}`}
                      onClick={() => toggleDone(r.id)}
                    >
                      {r.done ? 'Undo' : 'Done'}
                    </button>
                    <button
                      className="btn small ghost"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="t-x"
                      style={{ opacity: 1 }}
                      onClick={() => setConfirmDelete(r.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit reminder' : 'New reminder'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {editId ? (
              <button className="btn danger" onClick={() => { if (editId) { remove(editId); setModal(false); } }}>
                Delete
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={save}>
                {editId ? 'Save' : 'Add Reminder'}
              </button>
            </div>
          </div>
        }
      >
        <div className="fld">
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Call dentist"
            autoFocus
          />
        </div>
        <div className="frow">
          <div className="fld">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="fld">
            <label>Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
        </div>
        <div className="fld">
          <label>Repeat</label>
          <select
            value={form.repeat}
            onChange={(e) => setForm({ ...form, repeat: e.target.value })}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="fld">
          <label>Note (optional)</label>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Any extra detail…"
          />
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete reminder?"
        footer={
          <button className="btn danger" onClick={() => confirmDelete && remove(confirmDelete)}>
            Delete
          </button>
        }
      >
        <p className="sub">This cannot be undone.</p>
      </Modal>
    </>
  );
}
