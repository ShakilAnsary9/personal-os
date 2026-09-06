'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { isRecurring } from '@/lib/tasks';
import { habitStreak } from '@/lib/habits';
import { fmtShort } from '@/lib/dates';
import { fmtMoney } from '@/lib/money';
import {
  Search,
  Plus,
  LayoutGrid,
  Sun,
  ClipboardCheck,
  Heart,
  MonitorPlay,
  Folder,
  CreditCard,
  FileText,
  MapPin,
  Calculator,
  TrendingUp,
  Archive,
  Settings,
  Download,
  Keyboard,
  type LucideIcon,
} from 'lucide-react';

interface SearchItem {
  k: string;
  title: string;
  hint?: string;
  icon?: LucideIcon;
  go: () => void;
  isAction?: boolean;
}

const ACTION_ICON: Record<string, LucideIcon> = {
  'new task': ClipboardCheck,
  'new content': MonitorPlay,
  'new project': Folder,
  'new note': FileText,
  'log income / expense': CreditCard,
  'add investment': TrendingUp,
  'add loan': CreditCard,
  'new habit': Heart,
  'export backup': Download,
  'show keyboard shortcuts': Keyboard,
};

const GO_ICON: Record<string, LucideIcon> = {
  dashboard: LayoutGrid,
  today: Sun,
  tasks: ClipboardCheck,
  habits: Heart,
  content: MonitorPlay,
  projects: Folder,
  money: CreditCard,
  notes: FileText,
  review: TrendingUp,
  calculators: Calculator,
  archive: Archive,
  settings: Settings,
};

function buildActions(
  router: ReturnType<typeof useRouter>,
  close: () => void,
  openPalette: () => void,
): SearchItem[] {
  const go = (href: string) => { close(); router.push(href); };
  const goNew = (href: string) => { close(); router.push(href + '?new=1'); };

  return [
    { k: 'Action', title: 'New task', hint: 'create', icon: ACTION_ICON['new task'], isAction: true, go: () => goNew('/tasks') },
    { k: 'Action', title: 'New content', hint: 'pipeline', icon: ACTION_ICON['new content'], isAction: true, go: () => goNew('/content') },
    { k: 'Action', title: 'New project', hint: 'create', icon: ACTION_ICON['new project'], isAction: true, go: () => goNew('/projects') },
    { k: 'Action', title: 'New note', hint: 'sticky', icon: ACTION_ICON['new note'], isAction: true, go: () => goNew('/notes') },
    { k: 'Action', title: 'Log income / expense', hint: 'money', icon: ACTION_ICON['log income / expense'], isAction: true, go: () => goNew('/money') },
    { k: 'Action', title: 'Add investment', hint: 'money', icon: ACTION_ICON['add investment'], isAction: true, go: () => { close(); router.push('/money?tab=invest&new=1'); } },
    { k: 'Action', title: 'Add loan', hint: 'money', icon: ACTION_ICON['add loan'], isAction: true, go: () => { close(); router.push('/money?tab=loans&new=1'); } },
    { k: 'Action', title: 'New habit', hint: 'ritual', icon: ACTION_ICON['new habit'], isAction: true, go: () => goNew('/habits') },
    { k: 'Go to', title: 'Dashboard', hint: 'overview whole system', icon: GO_ICON['dashboard'], go: () => go('/dashboard') },
    { k: 'Go to', title: 'Today', hint: 'view', icon: GO_ICON['today'], go: () => go('/today') },
    { k: 'Go to', title: 'Tasks', hint: 'view', icon: GO_ICON['tasks'], go: () => go('/tasks') },
    { k: 'Go to', title: 'Habits', hint: 'view', icon: GO_ICON['habits'], go: () => go('/habits') },
    { k: 'Go to', title: 'Content', hint: 'view', icon: GO_ICON['content'], go: () => go('/content') },
    { k: 'Go to', title: 'Projects', hint: 'view', icon: GO_ICON['projects'], go: () => go('/projects') },
    { k: 'Go to', title: 'Money', hint: 'view', icon: GO_ICON['money'], go: () => go('/money') },
    { k: 'Go to', title: 'Notes', hint: 'view', icon: GO_ICON['notes'], go: () => go('/notes') },
    { k: 'Go to', title: 'Review', hint: 'insight weekly monthly', icon: GO_ICON['review'], go: () => go('/review') },
    { k: 'Go to', title: 'Calculators', hint: 'sip storage zakat emi cagr profit', icon: GO_ICON['calculators'], go: () => go('/calc') },
    { k: 'Go to', title: 'Archive', hint: 'view', icon: GO_ICON['archive'], go: () => go('/archive') },
    { k: 'Go to', title: 'Settings', hint: 'view', icon: GO_ICON['settings'], go: () => go('/settings') },
    { k: 'Action', title: 'Export backup', hint: 'data', icon: ACTION_ICON['export backup'], isAction: true, go: () => { close(); /* TODO: export */ } },
    { k: 'Action', title: 'Show keyboard shortcuts', hint: 'help', icon: ACTION_ICON['show keyboard shortcuts'], isAction: true, go: () => { close(); } },
  ];
}

function buildDataIndex(
  store: ReturnType<typeof useStore.getState>,
  router: ReturnType<typeof useRouter>,
  close: () => void,
): SearchItem[] {
  const idx: SearchItem[] = [];
  const go = (href: string) => { close(); router.push(href); };

  store.tasks.forEach((t) =>
    idx.push({
      k: 'Task',
      title: t.title,
      hint: isRecurring(t) ? 'recurring' : t.due ? fmtShort(t.due) : 'undated',
      go: () => go('/tasks'),
    }),
  );

  store.content.forEach((c) =>
    idx.push({
      k: 'Content',
      title: c.title,
      hint: c.stage,
      go: () => go('/content'),
    }),
  );

  store.projects.forEach((p) =>
    idx.push({
      k: 'Project',
      title: p.name,
      hint: [p.status, p.client, p.outsource].filter(Boolean).join(' · '),
      go: () => go('/projects'),
    }),
  );

  store.habits.forEach((h) =>
    idx.push({
      k: 'Habit',
      title: h.name,
      hint: habitStreak(h).cur + 'd streak',
      go: () => go('/habits'),
    }),
  );

  store.holdings.forEach((h) =>
    idx.push({
      k: 'Holding',
      title: h.symbol || h.name || 'Holding',
      hint: h.assetType,
      go: () => go('/money'),
    }),
  );

  store.loans.forEach((l) =>
    idx.push({
      k: 'Loan',
      title: l.person,
      hint: l.direction + ' · ' + fmtMoney(l.amount, l.currency),
      go: () => go('/money'),
    }),
  );

  store.notes.forEach((n) =>
    idx.push({
      k: 'Note',
      title: n.title || n.body || 'Untitled note',
      hint: n.pinned ? 'pinned' : 'note',
      go: () => go('/notes'),
    }),
  );

  store.money.forEach((m) =>
    idx.push({
      k: m.type === 'income' ? 'Income' : 'Expense',
      title: m.category || m.note || m.type,
      hint: fmtShort(m.date) + ' · ' + fmtMoney(m.amount, m.currency),
      go: () => go('/money'),
    }),
  );

  return idx;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useStore((s) => s.commandPaletteOpen);
  const close = useStore((s) => s.closeCommandPalette);
  const openPalette = useStore((s) => s.openCommandPalette);

  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(() => buildActions(router, close, openPalette), [router, close, openPalette]);
  const dataIndex = useMemo(
    () => buildDataIndex(useStore.getState(), router, close),
    [router, close],
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 9);
    const am = actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.k.toLowerCase().includes(q) ||
        (a.hint || '').toLowerCase().includes(q),
    );
    const dm = dataIndex.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.k.toLowerCase().includes(q) ||
        (i.hint || '').toLowerCase().includes(q),
    );
    return [...am, ...dm].slice(0, 40);
  }, [query, actions, dataIndex]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Keep selected item visible
  useEffect(() => {
    const el = resRef.current?.children[sel] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const pick = useCallback(
    (n: number) => {
      const it = items[n];
      if (it) it.go();
    },
    [items],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        pick(sel);
      } else if (e.key === 'Escape') {
        close();
      }
    },
    [items, sel, pick, close],
  );

  // Global Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? close() : openPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close, openPalette]);

  // Reset selection when items change
  useEffect(() => {
    setSel(0);
  }, [items.length, query]);

  return (
    <>
      {/* FAB */}
      <button
        className="fab-cmd"
        onClick={openPalette}
        aria-label="Command palette / search"
      >
        <Search size={20} strokeWidth={2} />
      </button>

      {/* Overlay */}
      <div className={`searchbox${open ? ' on' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="searchpanel">
          <input
            ref={inputRef}
            type="text"
            placeholder='Type a command or search…  e.g. "new task", "log expense", or any name'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
          />
          <div className="searchres" ref={resRef}>
            {items.length === 0 ? (
              <div className="empty" style={{ padding: 26 }}>
                <p>No matches{query ? ` for "${query}"` : ''}.</p>
              </div>
            ) : (
              items.map((item, n) => (
                <div
                  key={n}
                  className={`sres${n === sel ? ' sel' : ''}`}
                  onClick={() => pick(n)}
                  onMouseEnter={() => setSel(n)}
                >
                  <span className={`sk${item.isAction || item.k === 'Go to' ? ' sk-act' : ''}`}>
                    {item.icon && <item.icon size={10} strokeWidth={2} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                    {item.k}
                  </span>
                  <span className="stitle">{item.title || 'Untitled'}</span>
                  <span className="sh">{item.hint || ''}</span>
                </div>
              ))
            )}
          </div>
          <div className="searchfoot">
            <span>↑↓ navigate</span>
            <span>⏎ run</span>
            <span>esc close</span>
            <span style={{ marginLeft: 'auto' }}>Ctrl / ⌘ K</span>
          </div>
        </div>
      </div>
    </>
  );
}
