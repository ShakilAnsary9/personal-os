'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth, AuthProvider } from '@/components/AuthProvider';
import { isFeatureLocked, isProPlan, getSubscriptionLabel, type Subscription } from '@/lib/gate';
import { signOut } from '@/lib/auth';
import { CommandPalette } from '@/components/CommandPalette';
import {
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
  Lock,
  LogOut,
  Crown,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon; feature?: string }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/today', label: 'Today', Icon: Sun },
  { href: '/tasks', label: 'Tasks', Icon: ClipboardCheck },
  { href: '/habits', label: 'Habits', Icon: Heart },
  { href: '/content', label: 'Content', Icon: MonitorPlay, feature: 'content' },
  { href: '/projects', label: 'Projects', Icon: Folder, feature: 'projects' },
  { href: '/money', label: 'Money', Icon: CreditCard, feature: 'money' },
  { href: '/notes', label: 'Notes', Icon: FileText, feature: 'notes' },
  { href: '/reminders', label: 'Reminders', Icon: MapPin, feature: 'reminders' },
  { href: '/calc', label: 'Calculators', Icon: Calculator },
];

const NAV_SECONDARY: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/review', label: 'Review', Icon: TrendingUp },
  { href: '/archive', label: 'Archive', Icon: Archive },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings);
  const subscription = useStore((s) => s.subscription);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const segment = pathname.split('/').filter(Boolean)[0] || 'today';
  const isPro = isProPlan(subscription);

  function navClick(e: React.MouseEvent, href: string, feature?: string) {
    if (feature && !isPro && isFeatureLocked(feature, subscription)) {
      e.preventDefault();
      router.push('/settings?upgrade=1');
    }
  }

  return (
    <div id="app">
      <aside className="rail">
        <div className="rail-logo">
          <div className="mark">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect x="1.5" y="1.5" width="27" height="27" rx="3" stroke="#20261F" strokeWidth="2" fill="#FAF7EC" />
              <path d="M6 22 10.5 8h3.2L18 22h-3.1l-.8-2.7H9.9L9.1 22H6Zm4.6-5.2h3l-1.5-5-1.5 5Z" fill="#E8432D" />
              <path d="M19.5 22V8h2.9v14h-2.9Z" fill="#20261F" />
            </svg>
            <div className="wordmark">
              Ahsan Danish<em>·</em>OS
            </div>
          </div>
          <div className="mono">Daily cockpit — v2.0</div>
        </div>
        <nav id="nav">
          {NAV_ITEMS.map((item) => {
            const locked = item.feature && !isPro && isFeatureLocked(item.feature, subscription);
            return (
              <Link
                key={item.href}
                href={locked ? '/settings?upgrade=1' : item.href}
                className={`nav-btn${segment === item.href.slice(1) ? ' active' : ''}${locked ? ' locked nav-lock' : ''}`}
                onClick={(e) => navClick(e, item.href, item.feature)}
              >
                <item.Icon size={18} strokeWidth={1.8} />
                <span className="lbl">{item.label}</span>
              </Link>
            );
          })}
          <div className="nav-sep">Records</div>
          {NAV_SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-btn${segment === item.href.slice(1) ? ' active' : ''}`}
            >
              <item.Icon size={18} strokeWidth={1.8} />
              <span className="lbl">{item.label}</span>
            </Link>
          ))}
        </nav>
        {!isPro && (
          <div className="upgrade-banner">
            <p>Free tier · Money, Content, Projects, Notes & Reminders locked</p>
            <Link href="/settings?upgrade=1" className="upgrade-btn">
              <Crown size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Upgrade to Pro · $5/mo
            </Link>
          </div>
        )}
        <div className="rail-profile">
          <div className="who">
            <b>{settings.name || 'Ahsan Danish'}</b>
            <span>{getSubscriptionLabel(subscription)}</span>
          </div>
          <button
            onClick={signOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
      <CommandPalette />
      <div id="toast" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
