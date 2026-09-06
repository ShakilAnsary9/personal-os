import type {
  Task,
  Habit,
  Content,
  Project,
  MoneyEntry,
  Holding,
  Loan,
  Note,
  TeamMember,
  InboxItem,
  RecurringTemplate,
} from '@/types';
import { uid } from '@/lib/id';
import { dkey, todayKey, DAY } from '@/lib/dates';
import { PALETTE } from '@/lib/theme';
import { genThumb } from '@/lib/content';
import { getAdapter } from '@/lib/db';
import { useStore } from '@/lib/store';

function dOff(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dkey(d);
}

export async function loadSampleData(): Promise<void> {
  const hasData = useStore.getState().tasks.length ||
    useStore.getState().projects.length ||
    useStore.getState().content.length ||
    useStore.getState().money.length ||
    useStore.getState().habits.length;

  if (hasData && !confirm(
    'Load sample data on top of what you have? It adds demo tasks, habits, content, projects and money entries. (Use "Reset to new" first for a clean demo.)'
  )) return;

  const db = getAdapter();
  const now = Date.now();
  const tk = todayKey();

  // Team
  const teamData: TeamMember[] = [
    { name: 'Awais', role: 'Content editor' },
    { name: 'Bilal', role: 'WordPress dev' },
    { name: 'Hamza', role: 'Thumbnails' },
  ].map((t, i) => ({
    id: uid(),
    created: now + i,
    name: t.name,
    role: t.role,
    color: PALETTE[i % PALETTE.length],
  }));
  for (const t of teamData) await db.put('team', t);
  const [awais, bilal] = teamData;

  // Projects
  const projectData = [
    {
      name: 'WooCommerce store — Howdy Lighting',
      ptype: 'Freelance' as const,
      status: 'Active' as const,
      client: 'Howdy Lighting (US)',
      assignee: bilal.id,
      outsource: 'Kamran (contractor)',
      price: 1200,
      outsourceCost: 400,
      currency: 'USD' as const,
      next: 'Finish tiered pricing + trade account approval flow',
      revenue: null,
      notes: 'B2B LED store. Homeowner/Contractor/Distributor pricing, trade registration, branded emails, AJAX filter.',
    },
    {
      name: 'Exam prep platform — Saudi client',
      ptype: 'Freelance' as const,
      status: 'Active' as const,
      client: 'Al-Faisal Academy',
      assignee: awais.id,
      outsource: null,
      price: 900,
      outsourceCost: null,
      currency: 'USD' as const,
      next: 'Wire Moyasar payment gateway',
      revenue: null,
      notes: 'WordPress exam platform, Elementor front-end + custom exam-logic plugin. Moyasar / PayTabs for Saudi payments.',
    },
    {
      name: 'Fanned Card Gallery plugin',
      ptype: 'Own build' as const,
      status: 'Active' as const,
      client: null,
      assignee: bilal.id,
      outsource: null,
      price: null,
      outsourceCost: null,
      currency: 'PKR' as const,
      next: 'Ship v1.1.0 typography controls',
      revenue: 'CodeCanyon sales',
      notes: '3D fan-card animation gallery — custom post type, shortcode, per-gallery layout/style controls, global typography system.',
    },
    {
      name: '123calcs.com',
      ptype: 'Own build' as const,
      status: 'Active' as const,
      client: null,
      assignee: null,
      outsource: null,
      price: null,
      outsourceCost: null,
      currency: 'PKR' as const,
      next: 'Fix thin-content pages flagged in Search Console',
      revenue: '$60/mo AdSense',
      notes: '208+ page calculator site targeting AdSense. Indexing + template grammar cleanup ongoing.',
    },
    {
      name: 'testmylaptop.com',
      ptype: 'Own build' as const,
      status: 'Active' as const,
      client: null,
      assignee: awais.id,
      outsource: null,
      price: null,
      outsourceCost: null,
      currency: 'PKR' as const,
      next: 'Fix diagnostic run tool auto-advance bug',
      revenue: '$25/mo AdSense',
      notes: '23-tool browser hardware diagnostics site. Live testing found status-overwrite + right-click detection bugs.',
    },
    {
      name: 'skybluepoolsc.com',
      ptype: 'Freelance' as const,
      status: 'Paused' as const,
      client: 'Sky Blue Pools SC',
      assignee: bilal.id,
      outsource: null,
      price: 500,
      outsourceCost: null,
      currency: 'USD' as const,
      next: 'Confirm Cloudflare cache purge fixes toolbar bug',
      revenue: null,
      notes: 'Pool builder, Charleston SC. Admin toolbar visibility bug from SiteGround NGINX + Cloudflare stale snapshot.',
    },
    {
      name: 'qrparrot.com',
      ptype: 'Own build' as const,
      status: 'Shipped' as const,
      client: null,
      assignee: null,
      outsource: null,
      price: null,
      outsourceCost: null,
      currency: 'PKR' as const,
      next: null,
      revenue: '$15/mo AdSense',
      notes: '11-type QR generator — gradients, frames, contrast warnings, localStorage history. 49 JSON-LD blocks validated.',
      shippedAt: now - 1 * DAY,
    },
    {
      name: 'PDFHub',
      ptype: 'Own build' as const,
      status: 'Idea' as const,
      client: null,
      assignee: null,
      outsource: null,
      price: null,
      outsourceCost: null,
      currency: 'PKR' as const,
      next: 'Scope v2 — add compression tool',
      revenue: null,
      notes: '20-tool browser PDF site, self-hosted pdf-lib/pdf.js/JSZip/jsPDF. Packaged for Hostinger shared hosting.',
    },
  ].map((p, i) => ({
    id: uid(),
    created: now + i,
    archived: false,
    needsDetail: false,
    ...p,
  })) as Project[];
  for (const p of projectData) await db.put('projects', p);
  const [fcg, c123, tml] = projectData;

  // Tasks
  const taskData: Task[] = [
    { title: 'Check team content report', repeat: 'daily' as const },
    { title: 'PSX / KSE-100 review', repeat: 'weekdays' as const },
    { title: 'Reply to Upwork leads', repeat: 'weekdays' as const },
    { title: 'Weekly backup of client sites', repeat: 'weekly' as const, days: [1] },
    { title: 'Record 1 Reel (financial literacy)', repeat: 'weekly' as const, days: [2, 4] },
    { title: 'Ship Fanned Card Gallery v1.1.0', repeat: 'once' as const, due: dOff(2), projectId: fcg.id },
    { title: 'Fix 123calcs thin-content pages', repeat: 'once' as const, due: dOff(4), projectId: c123.id },
    { title: 'testmylaptop: fix auto-advance bug', repeat: 'once' as const, due: dOff(1), projectId: tml.id },
    { title: 'Invoice Saudi exam-platform client', repeat: 'once' as const, due: dOff(-1) },
    { title: 'Outline Etsy digital product kit', repeat: 'once' as const, due: null },
  ].map((t, i) => ({
    id: uid(),
    created: now + i,
    log: {} as Record<string, boolean>,
    days: null as number[] | null,
    due: null as string | null,
    projectId: null as string | null,
    notes: null as string | null,
    done: false,
    doneAt: null as number | null,
    needsDetail: false,
    ...t,
  }));

  taskData[0].log[tk] = true;
  for (const t of taskData) await db.put('tasks', t);

  // Habits
  const habitData: Habit[] = [
    { name: 'Check team report', icon: '\u260E', days: null },
    { name: 'Post 1 Reel', icon: '\u25B6', days: [1, 2, 3, 4, 5] },
    { name: 'PSX review', icon: '\u26A1', days: [1, 2, 3, 4, 5] },
    { name: 'No doomscroll before work', icon: '\u2665', days: null },
  ].map((h, i) => ({
    id: uid(),
    created: now + i,
    log: {} as Record<string, boolean>,
    ...h,
  }));

  // Seed streaks
  habitData.forEach((h, hi) => {
    for (let back = 0; back < 26; back++) {
      const d = new Date();
      d.setDate(d.getDate() - back);
      const k = dkey(d);
      const dow = d.getDay();
      const due = !h.days || h.days.includes(dow);
      if (!due) continue;
      if (back === 0 && hi === 1) continue;
      if (hi === 3 && back % 7 === 3) continue;
      h.log[k] = true;
    }
  });
  for (const h of habitData) await db.put('habits', h);

  // Content
  const contentData: Content[] = [
    {
      title: 'PSX for beginners — 3 costly mistakes',
      hook: 'Main ne apne pehle 10,000 aise gawaye\u2026',
      platforms: ['YouTube', 'Instagram Reels'],
      stage: 'Script',
      publishDate: dOff(2),
      script: '[HOOK] first loss story\n[BODY] 3 mistakes\n[CTA] follow for part 2',
      tnBigText: '90% LOSS?',
      tnSubText: 'main galtiyan',
      tnEmotion: 'shocked, pointing',
      tnColors: 'red / black / gold',
      tnObjects: 'down chart arrow, phone',
      tnLayout: 'face left, text right',
    },
    {
      title: 'Etsy se dollars kaise kamayein',
      hook: 'Bina inventory ke, ghar baithe\u2026',
      platforms: ['YT Shorts', 'TikTok'],
      stage: 'Idea',
      publishDate: dOff(6),
    },
    {
      title: 'WordPress freelancing — first client',
      hook: 'Upwork pe pehla client aise mila',
      platforms: ['Facebook', 'Instagram Reels'],
      stage: 'Record',
      publishDate: dOff(1),
    },
    {
      title: 'Fanned Card Gallery demo',
      hook: 'Ye 3D animation dekho \u2014 sirf CSS',
      platforms: ['YouTube'],
      stage: 'Edit',
      publishDate: dOff(-1),
    },
    {
      title: 'AI tools for Pakistani freelancers',
      hook: 'Ye 5 tools time bacha denge',
      platforms: ['YouTube', 'Facebook'],
      stage: 'Thumbnail',
      publishDate: dOff(3),
    },
    {
      title: 'How I built a QR generator in a weekend',
      hook: 'qrparrot.com banane ki kahani',
      platforms: ['YouTube'],
      stage: 'Published',
      publishDate: dOff(-5),
      publishedAt: now - 5 * DAY,
    },
  ].map((c, i) => {
    const base: Content = {
      id: uid(),
      created: now + i,
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
      title: '',
    };
    const o = { ...base, ...c } as Content;
    if (o.tnBigText || o.tnEmotion || o.tnColors) o.thumbScript = genThumb(o);
    return o;
  });
  for (const c of contentData) await db.put('content', c);

  // Money
  const moneyData: MoneyEntry[] = [];
  const cats: [string, string, [number, number]][] = [
    ['income', 'Freelance (Upwork)', [45000, 80000]],
    ['income', 'AdSense', [8000, 18000]],
    ['income', 'Etsy', [3000, 9000]],
    ['expense', 'Contractor payments', [15000, 30000]],
    ['expense', 'Tools & hosting', [4000, 9000]],
    ['expense', 'Ads / boost', [2000, 6000]],
  ];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const mid = dkey(new Date(d.getFullYear(), d.getMonth(), Math.min(15, 28)));
    cats.forEach((c, ci) => {
      const [lo, hi] = c[2];
      let amt = Math.round((lo + Math.random() * (hi - lo)) / 500) * 500;
      const isUsd = c[1] === 'AdSense' || c[1] === 'Etsy';
      if (isUsd) amt = Math.max(10, Math.round(amt / 278));
      moneyData.push({
        id: uid(),
        created: now + m * 10 + ci,
        type: c[0] as 'income' | 'expense',
        amount: amt,
        currency: isUsd ? 'USD' : 'PKR',
        category: c[1],
        date: mid,
        note: null,
      });
    });
  }
  for (const m of moneyData) await db.put('money', m);

  // Holdings
  const holdingData = [
    { assetType: 'Stock', symbol: 'MEBL', name: 'Meezan Bank', units: 200, buyRate: 145, currency: 'PKR' as const, curRate: 168, dividends: 4000 },
    { assetType: 'Stock', symbol: 'LUCK', name: 'Lucky Cement', units: 50, buyRate: 720, currency: 'PKR' as const, curRate: 690, buyUnknown: true, dividends: 0 },
    { assetType: 'Mutual Fund', symbol: 'MCB-PF', name: 'MCB Pakistan Stock Fund', units: 1000, buyRate: 95, currency: 'PKR' as const, curRate: 104, sip: { amount: 5000, currency: 'PKR' as const, day: 5, lastDone: null }, dividends: 2200 },
    { assetType: 'Crypto', symbol: 'BTC', name: 'Bitcoin', units: 0.05, buyRate: 58000, currency: 'USD' as const, curRate: 64000, sales: [{ qty: 0.02, rate: 66000, date: dOff(-20) }] },
    { assetType: 'Crypto', symbol: 'ETH', name: 'Ethereum', units: 0.8, buyRate: 3200, currency: 'USD' as const, curRate: 2950 },
  ].map((h, i) => ({
    id: uid(),
    created: now + i,
    buyUnknown: false,
    sip: null,
    dividends: 0,
    sales: [] as { qty: number; rate: number; date: string }[],
    ...h,
  })) as Holding[];
  for (const h of holdingData) await db.put('holdings', h);

  // Loans
  const loanData = [
    { direction: 'given' as const, person: 'Usman (cousin)', amount: 50000, currency: 'PKR' as const, due: dOff(20), note: 'Emergency \u2014 laptop repair', repaid: 10000, status: 'outstanding' as const },
    { direction: 'given' as const, person: 'Zeeshan', amount: 200, currency: 'USD' as const, due: null, note: 'Shared Canva Pro + domain cost', repaid: 0, status: 'outstanding' as const },
    { direction: 'taken' as const, person: 'Abbu', amount: 80000, currency: 'PKR' as const, due: null, note: 'Bike down payment', repaid: 30000, status: 'outstanding' as const },
    { direction: 'given' as const, person: 'Old client (Ali)', amount: 15000, currency: 'PKR' as const, due: null, note: 'Advance adjust', repaid: 15000, status: 'settled' as const },
  ].map((l, i) => ({
    id: uid(),
    created: now + i,
    ...l,
  })) as Loan[];
  for (const l of loanData) await db.put('loans', l);

  // Notes
  const noteData: Note[] = [
    { title: 'Broker login hint', body: 'PSX app \u2192 use the gmail one, 2FA on phone. CDC statement pw = old laptop name.', color: 'y', pinned: true },
    { title: 'Content ideas', body: '\u2022 PSX myths reel\n\u2022 Etsy first sale story\n\u2022 "freelancing se ghar chalana" series\n\u2022 AI tools carousel', color: 'g', pinned: false },
    { title: 'Client follow-ups', body: 'opklapbedkopen.nl \u2192 HTTPS fix\nskyblue pool \u2192 Cloudflare purge\nSaudi exam site \u2192 payment gateway', color: 'b', pinned: true },
    { title: 'Quick maths', body: '1 USD \u2248 278 PKR (update monthly)\nUpwork fee 10%\nEtsy fee ~6.5% + listing', color: 'o', pinned: false },
    { title: 'Buy \u2014 when funds allow', body: 'Add to MEBL on any dip under 160. Watch MCB-PF NAV.', color: 'p', pinned: false },
  ].map((n, i) => ({
    id: uid(),
    created: now - i * 3600000,
    updated: null,
    ...n,
  }));
  for (const n of noteData) await db.put('notes', n);

  // Recurring templates
  const templates: RecurringTemplate[] = [
    { id: uid(), type: 'income', label: 'Client retainer (WordPress)', amount: 60000, currency: 'PKR', freq: 'monthly', day: 1, autoLog: true, lastLogged: null },
    { id: uid(), type: 'income', label: 'Shop rental income', amount: 35000, currency: 'PKR', freq: 'monthly', day: 5, autoLog: true, lastLogged: null },
    { id: uid(), type: 'income', label: 'AdSense (123calcs + testmylaptop)', amount: 70, currency: 'USD', freq: 'monthly', day: 22, autoLog: true, lastLogged: null },
    { id: uid(), type: 'expense', label: 'Home rent', amount: 45000, currency: 'PKR', freq: 'monthly', day: 3, autoLog: true, lastLogged: null },
    { id: uid(), type: 'expense', label: 'Hosting + domains', amount: 6500, currency: 'PKR', freq: 'monthly', day: 10, autoLog: true, lastLogged: null },
    { id: uid(), type: 'expense', label: 'Canva + tools', amount: 25, currency: 'USD', freq: 'monthly', day: 15, autoLog: true, lastLogged: null },
    { id: uid(), type: 'expense', label: 'Domain renewals (annual)', amount: 12000, currency: 'PKR', freq: 'yearly', day: 1, autoLog: false, lastLogged: null },
  ];
  await useStore.getState().saveSettings({ templates });

  // Inbox
  for (const t of [
    'Idea: reel on "freelancing myths"',
    'Follow up with opklapbedkopen.nl about HTTPS',
  ]) {
    await db.put('inbox', { id: uid(), text: t, created: now + Math.random() } as InboxItem);
  }

  // Reload store
  await useStore.getState().loadAll();
}
