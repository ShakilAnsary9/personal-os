'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { EmptyState } from '@/components/EmptyState';
import { Package } from 'lucide-react';
import { toast } from '@/components/Toast';
import { todayKey, fmtShort, dkey, DAY } from '@/lib/dates';
import { fmtMoney } from '@/lib/money';
import { projectProgress, projProfit } from '@/lib/projects';
import { isRecurring, taskDoneOn } from '@/lib/tasks';
import { personColor, initials } from '@/lib/theme';
import { uid } from '@/lib/id';
import type { Task, Project, Content } from '@/types';

type Tab = 'projects' | 'tasks' | 'content';
type SortKey = 'recent' | 'old' | 'name';

export default function ArchivePage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const content = useStore((s) => s.content);
  const team = useStore((s) => s.team);
  const settings = useStore((s) => s.settings);
  const putTask = useStore((s) => s.putTask);

  const [tab, setTab] = useState<Tab>('projects');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const sortOpts: Record<Tab, [SortKey, string][]> = {
    projects: [['recent', 'Newest shipped'], ['old', 'Oldest shipped'], ['name', 'Name A\u2013Z']],
    tasks: [['recent', 'Newest done'], ['old', 'Oldest done'], ['name', 'Name A\u2013Z']],
    content: [['recent', 'Newest published'], ['old', 'Oldest published'], ['name', 'Name A\u2013Z']],
  };

  const memberName = (id: string) => team.find((t) => t.id === id)?.name || null;

  const archivedProjects = useMemo(() => {
    let list = projects.filter((p) => p.status === 'Shipped');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.client, p.outsource, p.notes].some((f) =>
          (f || '').toLowerCase().includes(q),
        ),
      );
    }
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'old') list.sort((a, b) => (a.shippedAt || 0) - (b.shippedAt || 0));
    else list.sort((a, b) => (b.shippedAt || 0) - (a.shippedAt || 0));
    return list;
  }, [projects, search, sort]);

  const doneTasks = useMemo(() => {
    let list = tasks.filter((t) => !isRecurring(t) && t.done);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const pn = t.projectId
          ? projects.find((p) => p.id === t.projectId)?.name || ''
          : '';
        return [t.title, pn].some((f) => (f || '').toLowerCase().includes(q));
      });
    }
    if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'old') list.sort((a, b) => (a.doneAt || 0) - (b.doneAt || 0));
    else list.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    return list;
  }, [tasks, projects, search, sort]);

  const publishedContent = useMemo(() => {
    let list = content.filter((c) => c.stage === 'Published');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        [c.title, c.hook, (c.platforms || []).join(' ')].some((f) =>
          (f || '').toLowerCase().includes(q),
        ),
      );
    }
    if (sort === 'name') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sort === 'old') list.sort((a, b) => (a.publishedAt || 0) - (b.publishedAt || 0));
    else list.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
    return list;
  }, [content, search, sort]);

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

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Completed</span>
            <h1 className="h-view">Archive</h1>
            <p className="sub">Shipped projects, done tasks, published content</p>
          </div>
        </div>

        <div className="subtabs">
          {(['projects', 'tasks', 'content'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`subtab${tab === t ? ' on' : ''}`}
              onClick={() => { setTab(t); setSort('recent'); }}
              data-t={t}
            >
              {t === 'projects' ? 'Shipped projects' : t === 'tasks' ? 'Done tasks' : 'Published content'}
            </button>
          ))}
        </div>

        <div className="proj-controls">
          <input
            type="text"
            className="searchbar"
            placeholder="Search archive…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="sortsel"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {sortOpts[tab].map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>

        {tab === 'projects' &&
          (archivedProjects.length === 0 ? (
            <EmptyState icon={Package} label={search ? 'no matches' : 'nothing shipped yet'} message={search ? 'Nothing matches your search.' : 'When a project is marked Shipped it lands here.'} />
          ) : (
            <div className="pgrid">
              {archivedProjects.map((p) => {
                const prog = projectProgress(p, tasks);
                const profit = projProfit(p, settings.usdRate);
                return (
                  <div key={p.id} className="pcard">
                    <div className="pcard-top">
                      <span className="st-pill st-Shipped">Shipped</span>
                    </div>
                    <h4>{p.name}</h4>
                    {p.client && (
                      <div className="pcard-money">
                        <span className="chip blue">{p.client}</span>
                        {profit != null && (
                          <span className={`chip ${profit >= 0 ? 'pine' : 'red'}`}>
                            {fmtMoney(profit, 'PKR')}
                          </span>
                        )}
                      </div>
                    )}
                    {p.assignee && memberName(p.assignee) && (
                      <div className="passign">
                        <span
                          className="avatar"
                          style={{ background: personColor(team.findIndex((t) => t.id === p.assignee)) }}
                        >
                          {initials(memberName(p.assignee)!)}
                        </span>
                        {memberName(p.assignee)}
                      </div>
                    )}
                    <div className="pnext">
                      <span className="mono">Shipped</span>{' '}
                      {p.shippedAt ? fmtShort(dkey(new Date(p.shippedAt))) : '\u2014'}
                    </div>
                    {prog.total > 0 && (
                      <div className="pbar">
                        <div style={{ width: `${prog.pct}%` }} />
                      </div>
                    )}
                    <div className="pcard-foot">
                      <span>
                        {prog.done}/{prog.total} tasks
                      </span>
                      {p.revenue && <span>{p.revenue}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === 'tasks' &&
          (doneTasks.length === 0 ? (
            <EmptyState icon={Package} label={search ? 'no matches' : 'no completed tasks'} message={search ? 'Nothing matches your search.' : 'Finished one-off tasks collect here.'} />
          ) : (
            <div className="card" style={{ padding: '6px 8px' }}>
              {doneTasks.map((t) => {
                const pn = t.projectId
                  ? projects.find((p) => p.id === t.projectId)?.name || null
                  : null;
                return (
                  <div key={t.id} className="trow done">
                    <button className="tcheck" onClick={() => toggleTaskDone(t)} />
                    <div className="t-main">
                      <div className="t-title">{t.title}</div>
                      <div className="t-meta">
                        {t.doneAt && (
                          <span className="mono tiny">
                            done {fmtShort(dkey(new Date(t.doneAt)))}
                          </span>
                        )}
                        {pn && <span className="chip gold">{pn}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === 'content' &&
          (publishedContent.length === 0 ? (
            <EmptyState icon={Package} label={search ? 'no matches' : 'nothing published'} message={search ? 'Nothing matches your search.' : 'Move content to the Published stage and it shows here.'} />
          ) : (
            <div className="board" style={{ flexWrap: 'wrap' }}>
              <div className="col" style={{ minWidth: 280 }}>
                <div className="col-h">
                  <span className="dot" style={{ background: 'var(--pine)' }} />
                  <b>Published</b>
                  <span className="mono">{publishedContent.length}</span>
                </div>
                <div className="col-b">
                  {publishedContent.map((c) => (
                    <div key={c.id} className="ccard">
                      <div className="ct">{c.title}</div>
                      <div className="cm">
                        {(c.platforms || []).map((p) => (
                          <span key={p} className="chip">{p}</span>
                        ))}
                        {c.publishDate && (
                          <span className="pubdate">{fmtShort(c.publishDate)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </section>
    </>
  );
}
