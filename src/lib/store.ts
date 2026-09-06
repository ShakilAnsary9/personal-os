'use client';

import { create } from 'zustand';
import type {
  Settings,
  Task,
  Habit,
  Content,
  Project,
  MoneyEntry,
  Holding,
  Loan,
  Note,
  Reminder,
  TeamMember,
  InboxItem,
} from '@/types';
import { getAdapter } from '@/lib/db';
import type { Subscription } from '@/lib/gate';

function defaultSettings(): Settings {
  return {
    id: 'settings',
    name: 'Ahsan Danish',
    pfp: '',
    platforms: ['YouTube', 'YT Shorts', 'Instagram Reels', 'TikTok', 'Facebook'],
    stages: ['Idea', 'Script', 'Record', 'Edit', 'Thumbnail', 'Scheduled', 'Published'],
    markets: ['Stock', 'Mutual Fund', 'Crypto'],
    templates: [],
    usdRate: 1,
    baseCurrency: 'USD',
  };
}

interface AppState {
  // Data
  settings: Settings;
  tasks: Task[];
  habits: Habit[];
  content: Content[];
  projects: Project[];
  inbox: InboxItem[];
  team: TeamMember[];
  money: MoneyEntry[];
  holdings: Holding[];
  loans: Loan[];
  notes: Note[];
  reminders: Reminder[];

  // Subscription
  subscription: Subscription | null;

  // UI state
  currentView: string;
  filterPlatform: string | null;
  projPerson: string | null;
  commandPaletteOpen: boolean;

  // Loaded flag
  loaded: boolean;

  // Actions
  loadAll: () => Promise<void>;
  setSubscription: (s: Subscription | null) => void;
  setView: (view: string) => void;
  setFilterPlatform: (p: string | null) => void;
  setProjPerson: (id: string | null) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // CRUD helpers
  putTask: (t: Task) => Promise<void>;
  delTask: (id: string) => Promise<void>;
  putHabit: (h: Habit) => Promise<void>;
  delHabit: (id: string) => Promise<void>;
  putContent: (c: Content) => Promise<void>;
  delContent: (id: string) => Promise<void>;
  putProject: (p: Project) => Promise<void>;
  delProject: (id: string) => Promise<void>;
  putMoney: (m: MoneyEntry) => Promise<void>;
  delMoney: (id: string) => Promise<void>;
  putHolding: (h: Holding) => Promise<void>;
  delHolding: (id: string) => Promise<void>;
  putLoan: (l: Loan) => Promise<void>;
  delLoan: (id: string) => Promise<void>;
  putNote: (n: Note) => Promise<void>;
  delNote: (id: string) => Promise<void>;
  putReminder: (r: Reminder) => Promise<void>;
  delReminder: (id: string) => Promise<void>;
  putTeam: (t: TeamMember) => Promise<void>;
  delTeam: (id: string) => Promise<void>;
  putInbox: (i: InboxItem) => Promise<void>;
  delInbox: (id: string) => Promise<void>;
  saveSettings: (s: Partial<Settings>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial data
  settings: defaultSettings(),
  tasks: [],
  habits: [],
  content: [],
  projects: [],
  inbox: [],
  team: [],
  money: [],
  holdings: [],
  loans: [],
  notes: [],
  reminders: [],

  // Subscription
  subscription: null,

  // UI
  currentView: 'today',
  filterPlatform: null,
  projPerson: null,
  commandPaletteOpen: false,
  loaded: false,

  // Load all data from IndexedDB
  loadAll: async () => {
    const db = getAdapter();
    const [meta, tasks, habits, content, projects, inbox, team, money, holdings, loans, notes, reminders] =
      await Promise.all([
        db.getAll('meta'),
        db.getAll('tasks'),
        db.getAll('habits'),
        db.getAll('content'),
        db.getAll('projects'),
        db.getAll('inbox'),
        db.getAll('team'),
        db.getAll('money'),
        db.getAll('holdings'),
        db.getAll('loans'),
        db.getAll('notes'),
        db.getAll('reminders'),
      ]);

    // In Supabase, profile row has id=user.id. In IndexedDB, it has id='settings'.
    const settings = meta[0] || defaultSettings();
    const defaults = defaultSettings();
    if (!Array.isArray(settings.platforms) || !settings.platforms.length) settings.platforms = defaults.platforms;
    if (!Array.isArray(settings.stages) || !settings.stages.length) settings.stages = defaults.stages;
    if (!Array.isArray(settings.markets) || !settings.markets.length) settings.markets = defaults.markets;
    if (!settings.usdRate) settings.usdRate = defaults.usdRate;
    if (!Array.isArray(settings.templates)) settings.templates = [];

    set({
      settings,
      tasks: tasks || [],
      habits: habits || [],
      content: content || [],
      projects: projects || [],
      inbox: (inbox || []).sort((a: any, b: any) => (b.created || 0) - (a.created || 0)),
      team: (team || []).sort((a: any, b: any) => (a.created || 0) - (b.created || 0)),
      money: money || [],
      holdings: holdings || [],
      loans: loans || [],
      notes: notes || [],
      reminders: reminders || [],
      loaded: true,
    });
  },

  setView: (view) => set({ currentView: view }),
  setFilterPlatform: (p) => set({ filterPlatform: p }),
  setProjPerson: (id) => set({ projPerson: id }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  setSubscription: (s) => set({ subscription: s }),

  // Generic CRUD: put and update local state
  putTask: async (t) => {
    await getAdapter().put('tasks', t);
    set((s) => {
      const idx = s.tasks.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const tasks = [...s.tasks];
        tasks[idx] = t;
        return { tasks };
      }
      return { tasks: [...s.tasks, t] };
    });
  },
  delTask: async (id) => {
    await getAdapter().del('tasks', id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  putHabit: async (h) => {
    await getAdapter().put('habits', h);
    set((s) => {
      const idx = s.habits.findIndex((x) => x.id === h.id);
      if (idx >= 0) {
        const habits = [...s.habits];
        habits[idx] = h;
        return { habits };
      }
      return { habits: [...s.habits, h] };
    });
  },
  delHabit: async (id) => {
    await getAdapter().del('habits', id);
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
  },

  putContent: async (c) => {
    await getAdapter().put('content', c);
    set((s) => {
      const idx = s.content.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        const content = [...s.content];
        content[idx] = c;
        return { content };
      }
      return { content: [...s.content, c] };
    });
  },
  delContent: async (id) => {
    await getAdapter().del('content', id);
    set((s) => ({ content: s.content.filter((c) => c.id !== id) }));
  },

  putProject: async (p) => {
    await getAdapter().put('projects', p);
    set((s) => {
      const idx = s.projects.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const projects = [...s.projects];
        projects[idx] = p;
        return { projects };
      }
      return { projects: [...s.projects, p] };
    });
  },
  delProject: async (id) => {
    await getAdapter().del('projects', id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  putMoney: async (m) => {
    await getAdapter().put('money', m);
    set((s) => {
      const idx = s.money.findIndex((x) => x.id === m.id);
      if (idx >= 0) {
        const money = [...s.money];
        money[idx] = m;
        return { money };
      }
      return { money: [...s.money, m] };
    });
  },
  delMoney: async (id) => {
    await getAdapter().del('money', id);
    set((s) => ({ money: s.money.filter((m) => m.id !== id) }));
  },

  putHolding: async (h) => {
    await getAdapter().put('holdings', h);
    set((s) => {
      const idx = s.holdings.findIndex((x) => x.id === h.id);
      if (idx >= 0) {
        const holdings = [...s.holdings];
        holdings[idx] = h;
        return { holdings };
      }
      return { holdings: [...s.holdings, h] };
    });
  },
  delHolding: async (id) => {
    await getAdapter().del('holdings', id);
    set((s) => ({ holdings: s.holdings.filter((h) => h.id !== id) }));
  },

  putLoan: async (l) => {
    await getAdapter().put('loans', l);
    set((s) => {
      const idx = s.loans.findIndex((x) => x.id === l.id);
      if (idx >= 0) {
        const loans = [...s.loans];
        loans[idx] = l;
        return { loans };
      }
      return { loans: [...s.loans, l] };
    });
  },
  delLoan: async (id) => {
    await getAdapter().del('loans', id);
    set((s) => ({ loans: s.loans.filter((l) => l.id !== id) }));
  },

  putNote: async (n) => {
    await getAdapter().put('notes', n);
    set((s) => {
      const idx = s.notes.findIndex((x) => x.id === n.id);
      if (idx >= 0) {
        const notes = [...s.notes];
        notes[idx] = n;
        return { notes };
      }
      return { notes: [...s.notes, n] };
    });
  },
  delNote: async (id) => {
    await getAdapter().del('notes', id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  putReminder: async (r) => {
    await getAdapter().put('reminders', r);
    set((s) => {
      const idx = s.reminders.findIndex((x) => x.id === r.id);
      if (idx >= 0) {
        const reminders = [...s.reminders];
        reminders[idx] = r;
        return { reminders };
      }
      return { reminders: [...s.reminders, r] };
    });
  },
  delReminder: async (id) => {
    await getAdapter().del('reminders', id);
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
  },

  putTeam: async (t) => {
    await getAdapter().put('team', t);
    set((s) => {
      const idx = s.team.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const team = [...s.team];
        team[idx] = t;
        return { team };
      }
      return { team: [...s.team, t] };
    });
  },
  delTeam: async (id) => {
    await getAdapter().del('team', id);
    set((s) => ({ team: s.team.filter((t) => t.id !== id) }));
  },

  putInbox: async (i) => {
    await getAdapter().put('inbox', i);
    set((s) => ({
      inbox: [i, ...s.inbox].sort((a, b) => (b.created || 0) - (a.created || 0)),
    }));
  },
  delInbox: async (id) => {
    await getAdapter().del('inbox', id);
    set((s) => ({ inbox: s.inbox.filter((i) => i.id !== id) }));
  },

  saveSettings: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    await getAdapter().put('meta', updated);
    set({ settings: updated });
  },
}));
