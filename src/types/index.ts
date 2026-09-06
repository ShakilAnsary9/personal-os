export interface Settings {
  id: string;
  name: string;
  pfp: string;
  platforms: string[];
  stages: string[];
  markets: string[];
  templates: RecurringTemplate[];
  usdRate: number;
  baseCurrency: string;
  lastBackup?: number;
}

export interface RecurringTemplate {
  id: string;
  type: 'income' | 'expense';
  label: string;
  amount: number;
  currency: 'PKR' | 'USD';
  freq: 'monthly' | 'yearly';
  day: number;
  autoLog: boolean;
  lastLogged: string | null;
}

export interface Task {
  id: string;
  created: number;
  title: string;
  repeat: 'once' | 'daily' | 'weekdays' | 'weekly';
  days: number[] | null;
  due: string | null;
  done: boolean;
  doneAt: number | null;
  projectId: string | null;
  notes: string | null;
  needsDetail: boolean;
  log: Record<string, boolean>;
}

export interface Habit {
  id: string;
  created: number;
  name: string;
  icon: string | null;
  days: number[] | null;
  log: Record<string, boolean>;
}

export interface Content {
  id: string;
  created: number;
  title: string;
  hook: string | null;
  platforms: string[];
  stage: string;
  publishDate: string | null;
  publishedAt: number | null;
  script: string | null;
  notes: string | null;
  tnBigText: string | null;
  tnSubText: string | null;
  tnEmotion: string | null;
  tnColors: string | null;
  tnObjects: string | null;
  tnLayout: string | null;
  thumbScript: string | null;
}

export interface Project {
  id: string;
  created: number;
  name: string;
  ptype: 'Freelance' | 'Own build' | null;
  status: 'Idea' | 'Active' | 'Paused' | 'Shipped';
  client: string | null;
  assignee: string | null;
  outsource: string | null;
  price: number | null;
  outsourceCost: number | null;
  currency: 'PKR' | 'USD';
  next: string | null;
  revenue: string | null;
  notes: string | null;
  needsDetail: boolean;
  archived: boolean;
  shippedAt: number | null;
}

export interface MoneyEntry {
  id: string;
  created: number;
  type: 'income' | 'expense';
  amount: number;
  currency: 'PKR' | 'USD';
  category: string | null;
  date: string;
  note: string | null;
}

export interface Holding {
  id: string;
  created: number;
  assetType: string;
  symbol: string;
  name: string | null;
  units: number;
  buyRate: number;
  currency: 'PKR' | 'USD';
  curRate: number | null;
  buyUnknown: boolean;
  dividends: number;
  sip: SipInfo | null;
  sales: SaleRecord[];
}

export interface SipInfo {
  amount: number;
  currency: 'PKR' | 'USD';
  day: number;
  lastDone: string | null;
}

export interface SaleRecord {
  qty: number;
  rate: number;
  date: string;
}

export interface Loan {
  id: string;
  created: number;
  direction: 'given' | 'taken';
  person: string;
  amount: number;
  currency: 'PKR' | 'USD';
  due: string | null;
  note: string | null;
  repaid: number;
  status: 'outstanding' | 'settled';
}

export interface Note {
  id: string;
  created: number;
  title: string | null;
  body: string | null;
  color: string;
  pinned: boolean;
  updated: number | null;
}

export interface Reminder {
  id: string;
  created: number;
  title: string;
  remindAt: number | null;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  note: string | null;
  done: boolean;
  updated: number | null;
}

export interface TeamMember {
  id: string;
  created: number;
  name: string;
  role: string | null;
  color: string;
}

export interface InboxItem {
  id: string;
  text: string;
  created: number;
}

export type StoreName =
  | 'meta'
  | 'tasks'
  | 'habits'
  | 'content'
  | 'projects'
  | 'inbox'
  | 'team'
  | 'money'
  | 'holdings'
  | 'loans'
  | 'notes'
  | 'reminders';

export type DayPart = 'dawn' | 'morning' | 'noon' | 'evening' | 'dusk' | 'night';

export interface DayPartMeta {
  cap: string;
  greet: string;
  color: string;
}

export interface HoldingCalc {
  inv: number;
  cur: number;
  pl: number;
  plpct: number;
  div: number;
  realized: number;
  totalReturn: number;
}

export interface MonthNet {
  inc: number;
  exp: number;
  net: number;
}

export interface LoanTotals {
  recv: number;
  pay: number;
}

export interface PortfolioTotals {
  inv: number;
  cur: number;
  pl: number;
  div: number;
  realized: number;
}
