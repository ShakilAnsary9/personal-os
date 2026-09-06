'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { uid } from '@/lib/id';
import { dkey, fmtShort } from '@/lib/dates';
import { NOTE_COLORS } from '@/lib/theme';
import { ClipboardList, MapPin, X } from 'lucide-react';
import type { Note } from '@/types';

const COLOR_MAP: Record<string, string> = Object.fromEntries(NOTE_COLORS);

export default function NotesPage() {
  const notes = useStore((s) => s.notes);
  const putNote = useStore((s) => s.putNote);
  const delNote = useStore((s) => s.delNote);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('y');
  const [pinned, setPinned] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') openAdd();
  }, []);

  const filtered = useMemo(() => {
    let list = [...notes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) =>
        [n.title, n.body].some((f) => (f || '').toLowerCase().includes(q)),
      );
    }
    list.sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
        (b.created || 0) - (a.created || 0),
    );
    return list;
  }, [notes, search]);

  function openAdd() {
    setEditId(null);
    setTitle('');
    setBody('');
    setColor('y');
    setPinned(false);
    setModal(true);
  }

  function openEdit(n: Note) {
    setEditId(n.id);
    setTitle(n.title || '');
    setBody(n.body || '');
    setColor(n.color || 'y');
    setPinned(n.pinned);
    setModal(true);
  }

  function save() {
    if (!title.trim() && !body.trim()) {
      toast('Write something first');
      return;
    }
    const n: Note = editId
      ? { ...(notes.find((x) => x.id === editId) as Note) }
      : { id: uid(), created: Date.now(), title: null, body: null, color: 'y', pinned: false, updated: null };
    n.title = title.trim() || null;
    n.body = body.trim() || null;
    n.color = color;
    n.pinned = pinned;
    n.updated = Date.now();
    putNote(n);
    toast(editId ? 'Note saved' : 'Note added');
    setModal(false);
  }

  function togglePin(id: string) {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    putNote({ ...n, pinned: !n.pinned });
    toast(n.pinned ? 'Unpinned' : 'Pinned');
  }

  function remove(id: string) {
    delNote(id);
    toast('Note deleted');
    setConfirmDelete(null);
    setModal(false);
  }

  return (
    <>
      <Appbar onAdd={openAdd} />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Scratchpad</span>
            <h1 className="h-view">Notes</h1>
            <p className="sub">Sticky notes, ideas, snippets, bookmarks</p>
          </div>
          <button className="btn primary" onClick={openAdd}>
            + New note
          </button>
        </div>

        <div className="proj-controls">
          <input
            type="text"
            className="searchbar"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            label={search ? 'no matches' : 'blank corkboard'}
            message={
              search
                ? 'No notes match your search.'
                : 'Pin a reminder, drop an idea, stash a snippet. Click + New note to start.'
            }
          />
        ) : (
          <div className="notes-grid">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`snote snote-${n.color || 'y'}${n.pinned ? ' pinned' : ''}`}
                onClick={() => openEdit(n)}
              >
                <span className="pin" />
                {n.title && <div className="ntitle">{n.title}</div>}
                {n.body && <div className="nbody">{n.body}</div>}
                <div className="nfoot">
                  <span className="ndate">
                    {fmtShort(dkey(new Date(n.created || Date.now())))}
                  </span>
                  <span className="nact">
                    <button
                      title={n.pinned ? 'Unpin' : 'Pin'}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(n.id);
                      }}
                    >
                      <MapPin size={14} fill={n.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(n.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit note' : 'New note'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {editId ? (
              <button className="btn danger" onClick={() => remove(editId)}>
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
                {editId ? 'Save note' : 'Add note'}
              </button>
            </div>
          </div>
        }
      >
        <div className="fld">
          <label>Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broker login hint"
            autoFocus
          />
        </div>
        <div className="fld">
          <label>Note</label>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type anything…"
          />
        </div>
        <div className="fld">
          <label>Colour</label>
          <div className="color-dots">
            {NOTE_COLORS.map(([c, cls]) => (
              <span
                key={c}
                className={`color-dot ${cls}${color === c ? ' on' : ''}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Pin to top
        </label>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete note?"
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
