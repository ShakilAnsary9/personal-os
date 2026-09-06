'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { uid } from '@/lib/id';
import { todayKey, fmtShort, dkey, DAY } from '@/lib/dates';
import { fmtMoney, toPKR } from '@/lib/money';
import { projectProgress, projProfit } from '@/lib/projects';
import { Folder } from 'lucide-react';
import { taskDoneOn, isRecurring, repeatLabel } from '@/lib/tasks';
import type { Project, Task } from '@/types';

type SortKey = 'status' | 'name' | 'profit' | 'price' | 'recent';
type FormState = {
  name: string;
  ptype: 'Freelance' | 'Own build';
  status: 'Idea' | 'Active' | 'Paused' | 'Shipped';
  client: string;
  assignee: string;
  outsource: string;
  price: string;
  outsourceCost: string;
  currency: 'PKR' | 'USD';
  next: string;
  revenue: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  ptype: 'Freelance',
  status: 'Idea',
  client: '',
  assignee: '',
  outsource: '',
  price: '',
  outsourceCost: '',
  currency: 'PKR',
  next: '',
  revenue: '',
  notes: '',
};

const STATUS_ORDER: Record<string, number> = { Active: 0, Idea: 1, Paused: 2, Shipped: 3 };

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const settings = useStore((s) => s.settings);
  const putProject = useStore((s) => s.putProject);
  const delProject = useStore((s) => s.delProject);
  const putTask = useStore((s) => s.putTask);
  const projPerson = useStore((s) => s.projPerson);
  const setProjPerson = useStore((s) => s.setProjPerson);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sort, setSort] = useState<SortKey>('status');
  const [detailId, setDetailId] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') openAdd();
  }, []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const memberName = (id: string) => team.find((t) => t.id === id)?.name || 'Unknown';
  const memberColor = (id: string) => team.find((t) => t.id === id)?.color || '#888';

  /* ── filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = [...projects];
    if (projPerson === '__none') list = list.filter((p) => !p.assignee);
    else if (projPerson) list = list.filter((p) => p.assignee === projPerson);

    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'recent') return b.created - a.created;
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      if (sort === 'profit') {
        const pa = projProfit(a, settings.usdRate) ?? -Infinity;
        const pb = projProfit(b, settings.usdRate) ?? -Infinity;
        return pb - pa;
      }
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    });
    return list;
  }, [projects, projPerson, sort, settings.usdRate]);

  /* ── project tasks for detail ── */
  const detailProj = detailId ? projects.find((p) => p.id === detailId) : null;
  const detailTasks = useMemo(
    () => (detailId ? tasks.filter((t) => t.projectId === detailId) : []),
    [tasks, detailId],
  );
  const detailProg = detailProj ? projectProgress(detailProj, tasks) : null;

  /* ── modals ── */
  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(p: Project) {
    setEditId(p.id);
    setForm({
      name: p.name,
      ptype: p.ptype || 'Freelance',
      status: p.status,
      client: p.client || '',
      assignee: p.assignee || '',
      outsource: p.outsource || '',
      price: p.price != null ? String(p.price) : '',
      outsourceCost: p.outsourceCost != null ? String(p.outsourceCost) : '',
      currency: p.currency || 'PKR',
      next: p.next || '',
      revenue: p.revenue || '',
      notes: p.notes || '',
    });
    setModal(true);
  }

  function saveProject() {
    if (!form.name.trim()) {
      toast('Name required');
      return;
    }
    const now = Date.now();
    const p: Project = editId
      ? { ...(projects.find((x) => x.id === editId) as Project) }
      : { id: uid(), created: now, name: '', ptype: null, status: 'Idea', client: null, assignee: null, outsource: null, price: null, outsourceCost: null, currency: 'PKR', next: null, revenue: null, notes: null, needsDetail: false, archived: false, shippedAt: null };
    p.name = form.name.trim();
    p.ptype = form.ptype;
    p.status = form.status;
    p.client = form.client || null;
    p.assignee = form.assignee || null;
    p.outsource = form.outsource || null;
    p.price = form.price ? Number(form.price) : null;
    p.outsourceCost = form.outsourceCost ? Number(form.outsourceCost) : null;
    p.currency = form.currency;
    p.next = form.next || null;
    p.revenue = form.revenue || null;
    p.notes = form.notes || null;
    if (p.status === 'Shipped' && !p.shippedAt) p.shippedAt = Date.now();
    putProject(p);
    toast(editId ? 'Project updated' : 'Project added');
    setModal(false);
  }

  function deleteProject(id: string) {
    tasks.filter((t) => t.projectId === id).forEach((t) => putTask({ ...t, projectId: null }));
    delProject(id);
    toast('Project deleted');
    setConfirmDelete(null);
    if (detailId === id) setDetailId(null);
  }

  /* ── detail modal helpers ── */
  function addTaskToProject() {
    if (!newTaskTitle.trim() || !detailId) return;
    const t: Task = {
      id: uid(),
      created: Date.now(),
      title: newTaskTitle.trim(),
      repeat: 'once',
      days: null,
      due: null,
      done: false,
      doneAt: null,
      projectId: detailId,
      notes: null,
      needsDetail: false,
      log: {},
    };
    putTask(t);
    setNewTaskTitle('');
    toast('Task added');
  }

  function toggleTaskDone(t: Task) {
    const u = { ...t };
    if (isRecurring(t)) {
      const key = todayKey();
      u.log = { ...(t.log || {}), [key]: !(t.log && t.log[key]) };
    } else {
      u.done = !t.done;
      u.doneAt = !t.done ? Date.now() : null;
    }
    putTask(u);
  }

  /* ── render ── */
  return (
    <>
      <Appbar onAdd={openAdd} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Workforce</span>
            <h1 className="h-view">Projects</h1>
            <p className="sub">Manage and track all your projects.</p>
          </div>
          <button className="btn primary" onClick={openAdd}>
            + New project
          </button>
        </div>

        {/* People filter */}
        <div className="people-strip">
          <button className={`pbtn${projPerson === null ? ' on' : ''}`} onClick={() => setProjPerson(null)}>
            All
          </button>
          {team.map((m) => (
            <button
              key={m.id}
              className={`pbtn${projPerson === m.id ? ' on' : ''}`}
              onClick={() => setProjPerson(m.id)}
            >
              <span className="avatar" style={{ background: m.color }}>
                {m.name[0]}
              </span>
              {m.name}
            </button>
          ))}
          <button
            className={`pbtn${projPerson === '__none' ? ' on' : ''}`}
            onClick={() => setProjPerson('__none')}
          >
            Unassigned
          </button>
        </div>

        {/* Search + Sort */}
        <div className="proj-controls">
          <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="status">Sort: Status</option>
            <option value="name">Sort: Name</option>
            <option value="profit">Sort: Profit</option>
            <option value="price">Sort: Price</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState icon={Folder} label="No projects" message="Create your first project to get started." />
        ) : (
          <div className="pgrid">
            {filtered.map((p) => {
              const prog = projectProgress(p, tasks);
              const profit = projProfit(p, settings.usdRate);
              const tc = tasks.filter((t) => t.projectId === p.id && !isRecurring(t)).length;
              return (
                <div className="pcard" key={p.id} onClick={() => setDetailId(p.id)}>
                  <div className="pcard-top">
                    <span className={`st-pill st-${p.status}`}>{p.status}</span>
                    {p.ptype && <span className="chip">{p.ptype}</span>}
                  </div>
                  <h4>{p.name}</h4>
                  <div className="pcard-money">
                    {p.client && <span className="chip blue">{p.client}</span>}
                    {p.price != null && (
                      <span className="chip gold">{fmtMoney(p.price, p.currency || 'PKR')}</span>
                    )}
                    {p.outsourceCost != null && (
                      <span className="chip plum">{fmtMoney(p.outsourceCost, p.currency || 'PKR')}</span>
                    )}
                    {profit != null && (
                      <span className={`chip ${profit >= 0 ? 'pine' : 'red'}`}>
                        {fmtMoney(profit, 'PKR')} profit
                      </span>
                    )}
                  </div>
                  {p.assignee && (
                    <div className="passign">
                      <span className="avatar" style={{ background: memberColor(p.assignee) }}>
                        {memberName(p.assignee)[0]}
                      </span>
                      {memberName(p.assignee)}
                    </div>
                  )}
                  {p.next && <div className="pnext">{p.next}</div>}
                  {prog.total > 0 && (
                    <div className="pbar">
                      <div style={{ width: `${prog.pct}%` }} />
                    </div>
                  )}
                  <div className="pcard-foot">
                    <span>{tc} task{tc !== 1 ? 's' : ''}</span>
                    {p.revenue && <span>{p.revenue}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      <Modal
        open={detailProj !== null}
        onClose={() => setDetailId(null)}
        title={detailProj?.name || ''}
        wide
        footer={
          <>
            <button className="btn" onClick={() => detailProj && openEdit(detailProj)}>
              Edit
            </button>
            <button className="btn danger" onClick={() => detailId && setConfirmDelete(detailId)}>
              Delete
            </button>
          </>
        }
      >
        {detailProj && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`st-pill st-${detailProj.status}`}>{detailProj.status}</span>
              {detailProj.ptype && <span className="chip">{detailProj.ptype}</span>}
              {detailProj.client && <span className="chip blue">{detailProj.client}</span>}
            </div>

            <div className="pd-money-grid">
              <div className="mbox">
                <div className="mbox-l">Price</div>
                <div className="mbox-v">
                  {detailProj.price != null ? fmtMoney(detailProj.price, detailProj.currency || 'PKR') : '—'}
                </div>
              </div>
              <div className="mbox">
                <div className="mbox-l">Outsource</div>
                <div className="mbox-v">
                  {detailProj.outsourceCost != null
                    ? fmtMoney(detailProj.outsourceCost, detailProj.currency || 'PKR')
                    : '—'}
                </div>
              </div>
              <div className="mbox">
                <div className="mbox-l">Profit</div>
                <div className="mbox-v">
                  {projProfit(detailProj, settings.usdRate) != null
                    ? fmtMoney(projProfit(detailProj, settings.usdRate)!, 'PKR')
                    : '—'}
                </div>
              </div>
              {detailProg && (
                <div className="mbox">
                  <div className="mbox-l">Progress</div>
                  <div className="mbox-v">
                    {detailProg.done}/{detailProg.total} ({detailProg.pct}%)
                  </div>
                </div>
              )}
            </div>

            <div className="fld" style={{ marginTop: 12 }}>
              <label>Assignee</label>
              <select
                value={detailProj.assignee || ''}
                onChange={(e) =>
                  putProject({ ...detailProj, assignee: e.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {detailProj.next && (
              <div style={{ marginTop: 8 }}>
                <label className="sub" style={{ fontSize: 12 }}>Next action</label>
                <p>{detailProj.next}</p>
              </div>
            )}

            {detailProj.notes && (
              <div style={{ marginTop: 8 }}>
                <label className="sub" style={{ fontSize: 12 }}>Notes</label>
                <p style={{ whiteSpace: 'pre-wrap' }}>{detailProj.notes}</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Tasks</h4>
              {detailTasks.length === 0 && <p className="sub">No tasks yet.</p>}
              {detailTasks.map((t) => (
                <div key={t.id} className={`trow${t.done ? ' done' : ''}`}>
                  <button className="tcheck" onClick={() => toggleTaskDone(t)} />
                  <div className="t-main">
                    <div className="t-title">{t.title}</div>
                    {t.repeat !== 'once' && (
                      <div className="t-meta">
                        <span className="chip pine">↻ {repeatLabel(t)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="addline" style={{ marginTop: 8 }}>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task..."
                  onKeyDown={(e) => e.key === 'Enter' && addTaskToProject()}
                />
                <button className="btn small primary" onClick={addTaskToProject}>
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Project' : 'New Project'}
        wide
        footer={
          <button className="btn primary" onClick={saveProject}>
            {editId ? 'Save' : 'Add Project'}
          </button>
        }
      >
        <div className="fld">
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Project name"
            autoFocus
          />
        </div>
        <div className="fld">
          <label>Type</label>
          <div className="seg">
            {(['Freelance', 'Own build'] as const).map((t) => (
              <button
                key={t}
                className={form.ptype === t ? 'on' : ''}
                onClick={() => setForm((f) => ({ ...f, ptype: t }))}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="fld">
          <label>Status</label>
          <div className="seg">
            {(['Idea', 'Active', 'Paused', 'Shipped'] as const).map((s) => (
              <button
                key={s}
                className={form.status === s ? 'on' : ''}
                onClick={() => setForm((f) => ({ ...f, status: s }))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="fld">
          <label>Client</label>
          <input
            value={form.client}
            onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            placeholder="Client name"
          />
        </div>
        <div className="fld">
          <label>Assignee</label>
          <select
            value={form.assignee}
            onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="fld">
          <label>Outsource</label>
          <input
            value={form.outsource}
            onChange={(e) => setForm((f) => ({ ...f, outsource: e.target.value }))}
            placeholder="Outsourced to"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="fld" style={{ flex: 1 }}>
            <label>Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="fld" style={{ flex: 1 }}>
            <label>Outsource cost</label>
            <input
              type="number"
              value={form.outsourceCost}
              onChange={(e) => setForm((f) => ({ ...f, outsourceCost: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="fld" style={{ flex: 1 }}>
            <label>Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as 'PKR' | 'USD' }))}
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="fld">
          <label>Next action</label>
          <input
            value={form.next}
            onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
            placeholder="What's next?"
          />
        </div>
        <div className="fld">
          <label>Revenue</label>
          <input
            value={form.revenue}
            onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
            placeholder="e.g. Monthly retainer"
          />
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
        title="Delete project?"
        footer={
          <button className="btn danger" onClick={() => confirmDelete && deleteProject(confirmDelete)}>
            Delete
          </button>
        }
      >
        <p className="sub">Tasks will be unlinked. This cannot be undone.</p>
      </Modal>
    </>
  );
}
