'use client';

import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AppbarProps {
  onAdd?: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  today: 'Today',
  tasks: 'Tasks',
  habits: 'Habits',
  content: 'Content',
  projects: 'Projects',
  money: 'Money',
  notes: 'Notes',
  reminders: 'Reminders',
  calc: 'Calculators',
  review: 'Review',
  archive: 'Archive',
  settings: 'Settings',
};

export function Appbar({ onAdd }: AppbarProps) {
  const pathname = usePathname();
  const segment = pathname.split('/').filter(Boolean)[0] || 'today';
  const title = VIEW_TITLES[segment] || '';

  return (
    <header className="appbar">
      <div className="ab-left">
        <h2 className="ab-title">{title}</h2>
      </div>
      <div className="ab-right">
        {onAdd && (
          <button className="ab-add" onClick={onAdd}>
            <Plus size={18} strokeWidth={2.2} />
            <span>Add</span>
          </button>
        )}
      </div>
    </header>
  );
}
