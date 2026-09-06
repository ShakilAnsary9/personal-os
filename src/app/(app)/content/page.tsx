'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { todayKey, fmtShort } from '@/lib/dates';
import { genThumb } from '@/lib/content';
import { uid } from '@/lib/id';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import type { Content } from '@/types';

const STAGE_COLORS: Record<string, string> = {
  Idea: '#a78bfa',
  Script: '#60a5fa',
  Record: '#f472b6',
  Edit: '#facc15',
  Thumbnail: '#34d399',
  Scheduled: '#fb923c',
  Published: '#4ade80',
};

const EMPTY: Content = {
  id: '',
  created: 0,
  title: '',
  hook: null,
  platforms: [],
  stage: 'Idea',
  publishDate: null,
  publishedAt: null,
  script: null,
  notes: null,
  tnBigText: null,
  tnSubText: null,
  tnEmotion: null,
  tnColors: null,
  tnObjects: null,
  tnLayout: null,
  thumbScript: null,
};

export default function ContentPage() {
  const content = useStore((s) => s.content);
  const settings = useStore((s) => s.settings);
  const filterPlatform = useStore((s) => s.filterPlatform);
  const putContent = useStore((s) => s.putContent);
  const delContent = useStore((s) => s.delContent);
  const setFilterPlatform = useStore((s) => s.setFilterPlatform);

  const [view, setView] = useState<'board' | 'calendar'>('board');
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState<Content>({ ...EMPTY });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') openAdd();
  }, []);

  const filtered = useMemo(() => {
    if (!filterPlatform) return content;
    return content.filter((c) => c.platforms.includes(filterPlatform));
  }, [content, filterPlatform]);

  const grouped = useMemo(() => {
    const map: Record<string, Content[]> = {};
    for (const s of settings.stages) map[s] = [];
    for (const c of filtered) {
      if (map[c.stage]) map[c.stage].push(c);
    }
    return map;
  }, [filtered, settings.stages]);

  function openAdd() {
    setDraft({ ...EMPTY, id: '', created: Date.now(), stage: settings.stages[0] });
    setModal(true);
  }

  function openEdit(c: Content) {
    setDraft({ ...c });
    setModal(true);
  }

  async function save() {
    if (!draft.title.trim()) {
      toast('Title is required');
      return;
    }
    const c: Content = {
      ...draft,
      id: draft.id || uid(),
      created: draft.created || Date.now(),
      title: draft.title.trim(),
    };
    await putContent(c);
    toast(draft.id ? 'Updated' : 'Created');
    setModal(false);
  }

  async function remove(id: string) {
    await delContent(id);
    toast('Deleted');
    setModal(false);
  }

  function togglePlatform(p: string) {
    setDraft((d) => ({
      ...d,
      platforms: d.platforms.includes(p)
        ? d.platforms.filter((x) => x !== p)
        : [...d.platforms, p],
    }));
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOver(stage);
  }

  function onDragLeave() {
    setDragOver(null);
  }

  async function onDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOver(null);
    if (!dragId) return;
    const item = content.find((c) => c.id === dragId);
    if (!item || item.stage === stage) return;
    const updated: Content = {
      ...item,
      stage,
      publishedAt: stage === 'Published' && !item.publishedAt ? Date.now() : item.publishedAt,
    };
    await putContent(updated);
    setDragId(null);
    toast(`Moved to ${stage}`);
  }

  function handleExport() {
    const upcoming = content
      .filter((c) => c.stage !== 'Published')
      .sort((a, b) => (a.publishDate || '').localeCompare(b.publishDate || ''));
    const blob = new Blob([JSON.stringify(upcoming, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-pack-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported');
  }

  function generateBrief() {
    const brief = genThumb(draft);
    toast('Brief generated');
    alert(brief);
  }

  return (
    <>
      <Appbar onAdd={openAdd} />

      <div className="view-head">
        <div>
          <p className="eyebrow">Publishing</p>
          <h1 className="h-view">Content pipeline</h1>
          <p className="sub">Track content from idea to published</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="vtoggle">
            <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}>
              Board
            </button>
            <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>
              Calendar
            </button>
          </div>
          <button className="btn ghost" onClick={handleExport}>
            Export for manager
          </button>
          <button className="btn primary" onClick={openAdd}>
            + New content
          </button>
        </div>
      </div>

      <div className="filters">
        <button
          className={`fchip${!filterPlatform ? ' on' : ''}`}
          onClick={() => setFilterPlatform(null)}
        >
          All
        </button>
        {settings.platforms.map((p) => (
          <button
            key={p}
            className={`fchip${filterPlatform === p ? ' on' : ''}`}
            onClick={() => setFilterPlatform(filterPlatform === p ? null : p)}
          >
            {p}
          </button>
        ))}
      </div>

      {view === 'board' && (
        <div className="board">
          {settings.stages.map((stage) => (
            <div
              key={stage}
              className={`col${dragOver === stage ? ' dragover' : ''}`}
              onDragOver={(e) => onDragOver(e, stage)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, stage)}
            >
              <div className="col-h">
                <span className="dot" style={{ background: STAGE_COLORS[stage] || '#888' }} />
                <span className="mono">{stage}</span>
                <span className="mono">{grouped[stage]?.length || 0}</span>
              </div>
              <div className="col-b">
                {grouped[stage]?.map((c) => (
                  <div
                    key={c.id}
                    className="ccard"
                    draggable="true"
                    onDragStart={() => onDragStart(c.id)}
                    onClick={() => openEdit(c)}
                  >
                    <div className="ct">{c.title}</div>
                    {c.hook && <div className="hook">{c.hook}</div>}
                    <div className="cm">
                      {c.platforms.map((p) => (
                        <span key={p} className="chip">
                          {p}
                        </span>
                      ))}
                    </div>
                    {(c.tnBigText || c.tnSubText) && (
                      <div className="tnbadge">TN</div>
                    )}
                    {c.publishDate && (
                      <div className={`pubdate${c.publishDate < todayKey() && stage !== 'Published' ? ' late' : ''}`}>
                        {fmtShort(c.publishDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={draft.id ? 'Edit content' : 'New content'}
        wide
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {draft.id ? (
              <button className="btn danger" onClick={() => remove(draft.id)}>
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
                Save
              </button>
            </div>
          </div>
        }
      >
        <div className="frow">
          <div className="fld">
            <label>Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Content title"
            />
          </div>
          <div className="fld">
            <label>Hook</label>
            <input
              value={draft.hook || ''}
              onChange={(e) => setDraft({ ...draft, hook: e.target.value || null })}
              placeholder="Attention-grabbing hook"
            />
          </div>
        </div>

        <div className="fld">
          <label>Platforms</label>
          <div className="seg">
            {settings.platforms.map((p) => (
              <button
                key={p}
                className={draft.platforms.includes(p) ? 'on' : ''}
                onClick={() => togglePlatform(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="frow">
          <div className="fld">
            <label>Stage</label>
            <select
              value={draft.stage}
              onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
            >
              {settings.stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label>Publish date</label>
            <input
              type="date"
              value={draft.publishDate || ''}
              onChange={(e) => setDraft({ ...draft, publishDate: e.target.value || null })}
            />
          </div>
        </div>

        <div className="fld">
          <label>Script / Notes</label>
          <textarea
            rows={3}
            value={draft.script || ''}
            onChange={(e) => setDraft({ ...draft, script: e.target.value || null })}
            placeholder="Script or production notes"
          />
        </div>

        <fieldset style={{ border: '1px solid var(--brd)', borderRadius: 8, padding: 12, marginTop: 8 }}>
          <legend style={{ padding: '0 6px', fontSize: 13, color: 'var(--tx2)' }}>Thumbnail</legend>
          <div className="frow">
            <div className="fld">
              <label>Big text</label>
              <input
                value={draft.tnBigText || ''}
                onChange={(e) => setDraft({ ...draft, tnBigText: e.target.value || null })}
              />
            </div>
            <div className="fld">
              <label>Sub text</label>
              <input
                value={draft.tnSubText || ''}
                onChange={(e) => setDraft({ ...draft, tnSubText: e.target.value || null })}
              />
            </div>
          </div>
          <div className="frow">
            <div className="fld">
              <label>Face / Emotion</label>
              <input
                value={draft.tnEmotion || ''}
                onChange={(e) => setDraft({ ...draft, tnEmotion: e.target.value || null })}
              />
            </div>
            <div className="fld">
              <label>Colors</label>
              <input
                value={draft.tnColors || ''}
                onChange={(e) => setDraft({ ...draft, tnColors: e.target.value || null })}
              />
            </div>
          </div>
          <div className="frow">
            <div className="fld">
              <label>Objects</label>
              <input
                value={draft.tnObjects || ''}
                onChange={(e) => setDraft({ ...draft, tnObjects: e.target.value || null })}
              />
            </div>
            <div className="fld">
              <label>Layout</label>
              <input
                value={draft.tnLayout || ''}
                onChange={(e) => setDraft({ ...draft, tnLayout: e.target.value || null })}
              />
            </div>
          </div>
          <button className="btn small" onClick={generateBrief} style={{ marginTop: 4 }}>
            Generate brief
          </button>
        </fieldset>
      </Modal>
    </>
  );
}
